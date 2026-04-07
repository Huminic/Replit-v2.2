#!/usr/bin/env python3
"""Fix escaped template literals in chat.ts pipelineContext"""

filepath = '/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/chat.ts'

with open(filepath, 'r') as f:
    content = f.read()

# The file has literal backslash-dollar: \${pipelineMetrics.activePipeline}
# which prevents JS template interpolation. We need to remove the backslash
# so it becomes ${pipelineMetrics.activePipeline}

# These are the four specific replacements needed
replacements = [
    ('\\${pipelineMetrics.activePipeline}', '${pipelineMetrics.activePipeline}'),
    ('\\${pipelineMetrics.appointmentsToday}', '${pipelineMetrics.appointmentsToday}'),
    ('\\${pipelineMetrics.openEscalations}', '${pipelineMetrics.openEscalations}'),
    ('\\${pipelineMetrics.outboundSent24h}', '${pipelineMetrics.outboundSent24h}'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f'Fixed: {old} -> {new}')
    else:
        print(f'NOT FOUND: {old}')

with open(filepath, 'w') as f:
    f.write(content)

print('Done. Verifying...')

with open(filepath, 'r') as f:
    content = f.read()

idx = content.find('pipelineMetrics.activePipeline')
if idx > 0:
    print(f'Verification: {repr(content[idx-3:idx+40])}')
