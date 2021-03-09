test('One Test to Pass them all', async () => {
    const input = parseInt('10', 10)
    await expect(input).toBe(10)
})
