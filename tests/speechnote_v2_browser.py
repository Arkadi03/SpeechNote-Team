import asyncio, base64, json, os, subprocess, sys, time, urllib.request
from pathlib import Path
from websockets.asyncio.client import connect

root = Path.cwd()
from tempfile import TemporaryDirectory
tmp = TemporaryDirectory(ignore_cleanup_errors=True)
scratch = Path(tmp.name)
origin = 'http://127.0.0.1:8002'
wav = root / 'examples/speechnote-ru.wav'
edge = Path(os.environ['ProgramFiles(x86)']) / 'Microsoft/Edge/Application/msedge.exe'
download = scratch / 'qa-download'
download.mkdir(exist_ok=True)
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from tempfile import TemporaryDirectory

import secrets
fixture_key = secrets.token_urlsafe(16)

class Fixture(BaseHTTPRequestHandler):
    """HTTP contract fixture, never a substitute for an LLM."""
    def log_message(self, *args):
        pass

    def reply(self, code, data=b''):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin',origin)
        self.send_header('Access-Control-Allow-Headers','Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.reply(204)

    def do_POST(self):
        payload=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        valid=(self.path=='/v1/chat/completions' and payload['model']=='fixture'
               and self.headers.get('Authorization')=='Bearer '+fixture_key
               and 'проект' in payload['messages'][-1]['content'].lower())
        self.reply(200 if valid else 401,json.dumps({'choices':[{'message':{'content':'Проверка транспорта'}}]}).encode())

class CDP:
    def __init__(self, ws):
        self.ws, self.seq, self.errors = ws, 0, []
    async def call(self, method, **params):
        self.seq += 1
        await self.ws.send(json.dumps(dict(id=self.seq, method=method, params=params)))
        while True:
            msg = json.loads(await asyncio.wait_for(self.ws.recv(), 30))
            if msg.get('method') == 'Runtime.exceptionThrown':
                self.errors.append(msg['params']['exceptionDetails'].get('exception',{}).get('description','JS error'))
            if msg.get('id') == self.seq:
                if 'error' in msg: raise RuntimeError(str(msg['error']))
                return msg['result']
    async def js(self, expression):
        result = await self.call('Runtime.evaluate',expression=expression,awaitPromise=True,returnByValue=True,userGesture=True)
        if result.get('exceptionDetails'): raise RuntimeError(str(result['exceptionDetails']))
        return result['result'].get('value')
    async def until(self, expr, timeout=45):
        started = time.monotonic()
        while time.monotonic()-started < timeout:
            if await self.js(expr): return
            await asyncio.sleep(.25)
        raise RuntimeError('Timeout: '+expr+' '+str(await self.js("document.querySelector('#notice')?.textContent")))
async def test(physical):
    profile = scratch / ('qa-edge-' + str(time.time_ns()))
    args = [str(edge),'--headless','--disable-gpu','--no-first-run','--disable-extensions','--disable-background-networking',
            '--disable-features=msEdgeFirstRunExperience','--autoplay-policy=no-user-gesture-required','--remote-debugging-port=0',
            '--user-data-dir='+str(profile),'--window-size=1250,850','--use-fake-ui-for-media-stream']
    if not physical: args += ['--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+str(wav)]
    proc = subprocess.Popen(args+['about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    browser_ws = None
    try:
        portfile = profile / 'DevToolsActivePort'
        for i in range(100):
            if portfile.exists() and len(portfile.read_text().splitlines()) >= 2: break
            if proc.poll() is not None: raise RuntimeError('Edge exited '+str(proc.returncode))
            await asyncio.sleep(.2)
        port,browser_path = portfile.read_text().splitlines()[:2]
        browser_ws = await connect(f'ws://127.0.0.1:{port}'+browser_path,proxy=None)
        br = CDP(browser_ws)
        await br.call('Browser.grantPermissions',origin=origin,permissions=['audioCapture','clipboardReadWrite','clipboardSanitizedWrite'])
        await br.call('Browser.setDownloadBehavior',behavior='allow',downloadPath=str(download))
        pages=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list'))
        target=next(p for p in pages if p['type']=='page')
        async with connect(target['webSocketDebuggerUrl'],proxy=None,max_size=8_000_000) as ws:
            c=CDP(ws)
            await c.call('Runtime.enable')
            await c.call('Page.enable')
            await c.call('Page.bringToFront')
            await c.call('Emulation.setFocusEmulationEnabled',enabled=True)
            await c.call('Page.navigate',url=origin)
            await c.until("document.querySelector('#connection')?.dataset.state === 'ready'")
            print('PAGE',await c.js('document.title'),flush=True)
            async def mode(name):
                await c.js(f"""document.querySelector('[data-mode="{name}"]').click()""")
                assert await c.js('SN.mode')==name
            async def generate():
                await c.js("SN.el('generate').click()")
                await c.until("!SN.busy")
                return await c.js("SN.el('question-status').textContent")
            await mode('conference')
            assert 'Сначала' in await generate()
            await c.js("SN.el('tab-file').click()")
            doc=await c.call('DOM.getDocument')
            node=await c.call('DOM.querySelector',nodeId=doc['root']['nodeId'],selector='#audiofile')
            await c.call('DOM.setFileInputFiles',nodeId=node['nodeId'],files=[str(wav)])
            await c.js("SN.el('upload').click()")
            await c.until("!SN.busy && !!SN.transcript.text()",90)
            content=await c.js("SN.el('transcript').textContent")
            assert 'проект' in content.lower(),content
            print('UPLOAD',content,flush=True)
            assert 'имя модели' in await generate()
            await mode('settings')
            assert await c.js("SN.el('speakers').disabled && !SN.speakers()")
            await c.js("SN.el('llm-model').value='fixture'; SN.el('llm-url').value='http://example.com/v1'")
            await mode('conference')
            assert 'HTTPS' in await generate()
            await mode('settings')
            await c.js(f"SN.el('llm-url').value='http://127.0.0.1:{fixture.server_port}/v1'")
            await mode('conference')
            assert '401' in await generate()
            await mode('settings')
            await c.js("SN.el('llm-token').value="+json.dumps(fixture_key))
            await mode('conference')
            assert 'Ответ получен' in await generate()
            assert await c.js("SN.el('questions').textContent")=='Проверка транспорта'
            await mode('meeting')
            assert not await c.js("SN.transcript.text()")
            await mode('conference')
            assert await c.js("SN.transcript.text()")==content
            await mode('settings')
            await c.js("SN.el('llm-url').value='http://127.0.0.1:1/v1'; SN.el('llm-url').dispatchEvent(new Event('input'))")
            assert not await c.js("SN.el('llm-token').value")
            await mode('conference')
            assert 'Нет ответа' in await generate()
            print('TABS, SETTINGS, ERRORS and HTTP FIXTURE OK',flush=True)

            await c.js("SN.el('copy').click()")
            await c.until("SN.el('notice').textContent === 'Текст скопирован.'")
            assert await c.js("navigator.clipboard.readText()")==content
            print('CLIPBOARD exact match',flush=True)
            start=time.time()
            await c.js("SN.el('save').click()")
            for i in range(100):
                fresh=[p for p in download.glob('*.txt') if p.stat().st_mtime >= start-1]
                if fresh: break
                await asyncio.sleep(.15)
            assert any(p.read_text('utf-8')==content for p in fresh)
            print('TXT UTF-8 exact match',flush=True)
            await c.js("SN.el('clear').click()")
            assert await c.js("!SN.transcript.text() && SN.el('save').disabled && !SN.el('empty').hidden")
            bad=scratch/'bad-audio.wav'
            bad.write_bytes(b'invalid recording')
            await c.call('DOM.setFileInputFiles',nodeId=node['nodeId'],files=[str(bad)])
            await c.js("SN.el('upload').click()")
            await c.until("!SN.busy && SN.el('notice').dataset.error === 'true'")
            print('CLEAR + INVALID FILE OK',flush=True)
            await c.js("SN.el('tab-mic').click()")
            await mode("meeting")
            await c.js("""window.metrics={bytes:0,peak:0,label:''};const originalSend=WebSocket.prototype.send;
              WebSocket.prototype.send=function(data){if(data instanceof ArrayBuffer){metrics.bytes+=data.byteLength;for(const v of new Int16Array(data))metrics.peak=Math.max(metrics.peak,Math.abs(v))}return originalSend.call(this,data)};
              const devices=navigator.mediaDevices; const originalMic=devices.getUserMedia.bind(devices);
              devices.getUserMedia=async opts=>{const stream=await originalMic(opts);metrics.label=stream.getAudioTracks()[0].label;return stream};""")
            await c.js("SN.el('record').click()")
            await c.until("SN.el('record').classList.contains('recording') || SN.el('notice').dataset.error==='true'")
            if not await c.js("SN.el('record').classList.contains('recording')"):
                raise RuntimeError(str(await c.js("SN.el('notice').textContent")))
            await asyncio.sleep(3 if physical else 10.7)
            await c.js("SN.el('record').click()")
            await c.until("!SN.busy",100)
            metrics=await c.js('metrics')
            result=await c.js("({text:SN.transcript.text(),status:SN.el('notice').textContent,error:SN.el('notice').dataset.error})")
            print('PHYSICAL' if physical else 'VIRTUAL WAV',metrics,result,flush=True)
            assert result['error'] != 'true' and metrics['bytes']>32000
            if not physical: assert 'проект' in result['text'].lower() or 'добрый' in result['text'].lower()
            assert not c.errors,c.errors
    finally:
        if browser_ws:
            try: await browser_ws.send(json.dumps(dict(id=900,method='Browser.close')));await browser_ws.close()
            except Exception: pass
        try: proc.wait(timeout=8)
        except subprocess.TimeoutExpired: proc.terminate()
if __name__=='__main__':
    fixture=ThreadingHTTPServer(('127.0.0.1',0),Fixture)
    Thread(target=fixture.serve_forever,daemon=True).start()
    h=json.load(urllib.request.urlopen(origin+'/health'))
    assert h['ready'] and not h['diarization_available']
    code=subprocess.check_output(['curl.exe','-s','-o',os.devnull,'-w','%{http_code}','-F','file=@examples/speechnote-ru.wav','-F','diarization=true',origin+'/v1/audio/transcriptions']).decode()
    assert code=='400',code
    async def ws_diag():
        async with connect(origin.replace('http','ws')+'/asr?diarization=true',proxy=None) as ws:
            assert json.loads(await ws.recv())['type']=='error'
    asyncio.run(ws_diag())
    print('DIARIZATION UNAVAILABLE: REST and WebSocket rejected',flush=True)
    try:
        asyncio.run(test(False))
    finally:
        fixture.shutdown()
        fixture.server_close()
