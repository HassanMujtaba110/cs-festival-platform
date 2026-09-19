$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Write-Output "Static server listening at http://127.0.0.1:8080/"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($localPath)) {
            $localPath = "index.html"
        }

        $baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
        if (-not $baseDir) { $baseDir = Get-Location }
        $filePath = Join-Path $baseDir $localPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $mime
            $response.Headers.Add("Access-Control-Allow-Origin", "*")

            $fileStream = [System.IO.File]::OpenRead($filePath)
            $response.ContentLength64 = $fileStream.Length
            $fileStream.CopyTo($response.OutputStream)
            $fileStream.Close()
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("File Not Found: $localPath")
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.OutputStream.Close()
    } catch {
        Write-Warning "Request handling error: $_"
    }
}
