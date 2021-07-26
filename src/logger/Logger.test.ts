import logger from "./Logger"

test('Logger getLevel() works', () => {
    expect(logger.getLevel() == "warn");
});

test('Logger setLevel() works', () => {
    logger.setLevel("trace");
    expect(logger.getLevel() == "trace");
});

test('Logger trace() works', () => {
    const consoleSpy = jest.spyOn(logger.logger, 'trace');
    logger.trace("This trace works");
    expect(consoleSpy).toHaveBeenCalledWith("This trace works");
});

