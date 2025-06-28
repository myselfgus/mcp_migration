$json = '{"method": "tools/call", "params": {"name": "read_graph", "arguments": {}}}'
$response = Invoke-RestMethod -Uri 'https://mcp-memory-remote.voither.workers.dev' -Method POST -Body $json -ContentType 'application/json'
$response | ConvertTo-Json -Depth 10