/**
 * Executes a function and retries it if it fails, using exponential backoff.
 * 
 * @param fn The asynchronous function to execute.
 * @param retries The number of retry attempts before throwing the error.
 * @param delay The initial delay in milliseconds.
 * @param backoffFactor The multiplier for the delay on subsequent retries.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 4,
  delay = 1000,
  backoffFactor = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    console.warn(
      `[Retry] Operation failed. Retrying in ${delay}ms... (Remaining attempts: ${retries}). Error:`,
      error instanceof Error ? error.message : error
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * backoffFactor, backoffFactor);
  }
}
