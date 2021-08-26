import logger from "../src/logger/Logger"

test('Logger getLevel() works', () => {
    expect(logger.getLevel() === "warn");
});

test('Logger setLevel() works', () => {
    logger.setLevel("trace");
    expect(logger.getLevel() === "trace");
});

test('Logger trace() works', () => {
    const consoleSpy = jest.spyOn(logger.logger, 'trace');
    logger.trace("This trace() works");
    expect(consoleSpy).toHaveBeenCalledWith("This trace() works");
});

test('Logger debug() works', () => {
    const consoleSpy = jest.spyOn(logger.logger, 'debug');
    logger.debug("This debug() works");
    expect(consoleSpy).toHaveBeenCalledWith("This debug() works");
});

test('Logger log() works', () => {
    const consoleSpy = jest.spyOn(logger.logger, 'log');
    logger.log("This log() works");
    expect(consoleSpy).toHaveBeenCalledWith("This log() works");
});

test('Logger info() works', () => {
    const consoleSpy = jest.spyOn(logger.logger, 'info');
    logger.info("This info() works");
    expect(consoleSpy).toHaveBeenCalledWith("This info() works");
});

test('Logger warn() works', () => {
    const consoleSpy = jest.spyOn(logger.logger, 'warn');
    logger.warn("This warn() works");
    expect(consoleSpy).toHaveBeenCalledWith("This warn() works");
});

test('Logger error() works', () => {
    const consoleSpy = jest.spyOn(logger.logger, 'error');
    logger.error("This error() works");
    expect(consoleSpy).toHaveBeenCalledWith("This error() works");
});