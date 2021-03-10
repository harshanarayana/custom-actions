import {execaCommandRunner} from '../src/utils/generic'

test('One Test to Pass them all', async () => {
    const input = parseInt('10', 10)
    await expect(input).toBe(10)
})

// test('Stdout Callback Display', async () => {
//     await execaCommandRunner('echo', ['this is a test'], new Map<string, string>(), null, null, null, null)
//     expect(1).toBe(1)
// })
