import {execaCommandRunner, getIssueNumber, getNumberRange} from '../src/utils/generic'
import * as fs from 'fs'
import {promisify} from 'util'

test('One Test to Pass them all', async () => {
    const input = parseInt('10', 10)
    await expect(input).toBe(10)
})

test('Stdout Callback Display', async () => {
    await execaCommandRunner('echo', ['this is a test'], new Map<string, string>(), null, null, null, null)
    expect(1).toBe(1)
})

test('JSON Path Extraction for GitHub Issue Number', async () => {
    const readFile = promisify(fs.readFile)
    async function getEvent(): Promise<string> {
        const data = await readFile('./__tests__/issue-data.json')
        return data.toString().trim()
    }
    const data = await getEvent()
    const number = await getIssueNumber(data)
    expect(number).toBe(23)
})

test('Long Running Command With Timeout', async () => {
    process.env.COMMAND_TIMEOUT = '2'
    const state = await execaCommandRunner(
        'bash',
        ['-c', 'sleep infinity'],
        new Map<string, string>(),
        null,
        null,
        null,
        null
    )
    expect(state).toBeGreaterThan(0)
}, 300000)

test('Retry Some Commands', async () => {
    const retry = getNumberRange(10)
    for (let attempt = 0; attempt <= retry.length; attempt++) {
        console.log(`Attempt ${attempt}`)
        const state = await execaCommandRunner(
            'bash',
            ['invlidcommand'],
            new Map<string, string>(),
            null,
            null,
            null,
            null
        )
        expect(state).toBeGreaterThan(0)
    }
})
