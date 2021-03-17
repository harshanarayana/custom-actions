import {execaCommandRunner, getIssueNumber} from '../src/utils/generic'
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
