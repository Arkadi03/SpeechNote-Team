param([ValidateRange(1, 65535)][int]$Port = 8002, [switch]$Diarization)
$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot
try {
    $python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
    $runtime = ".venv"
    if (!(Test-Path -LiteralPath $python)) {
        $runtime = "../SpeechNote/.venv"
        $python = Join-Path $runtime "Scripts/python.exe"
    }
    if (!(Test-Path -LiteralPath $python)) { throw "Create .venv and install the dependencies listed in README.md." }
    $localFfmpeg = "C:\Program Files\iGameCenter\SAVIConverter\tools"
    if (!(Get-Command ffmpeg -ErrorAction SilentlyContinue) -and (Test-Path "$localFfmpeg\ffmpeg.exe")) {
        $env:PATH = "$localFfmpeg;$env:PATH"
    }
    if (!(Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw "FFmpeg must be available in PATH for file uploads." }
    $env:PYTHONUTF8 = "1"
    $env:CUDA_VISIBLE_DEVICES = "-1"
    $env:OMP_NUM_THREADS = "4"
    $options = @("--host", "127.0.0.1", "--port", "$Port", "--model", "tiny", "--language", "ru",
                 "--backend", "faster-whisper", "--backend-policy", "localagreement", "--pcm-input",
                 "--log-level", "INFO", "--warmup-file", "examples/speechnote-ru.wav")
    if (Test-Path "$runtime/faster-whisper-tiny/model.bin") { $options += @("--model_dir", "$runtime/faster-whisper-tiny") }
    if ($Diarization) { $options += @("--diarization", "--diarization-backend", "sortformer") }
    & $python -B -m whisperlivekit.basic_server @options
    if ($LASTEXITCODE) { throw "WhisperLiveKit exited with code $LASTEXITCODE." }
} finally {
    Pop-Location
}
