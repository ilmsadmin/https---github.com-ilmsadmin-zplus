/**
 * Circuit breaker implementation for resilient service communication
 */
export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  onOpen?: () => void;
  onClose?: () => void;
  onHalfOpen?: () => void;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private nextAttempt: number = Date.now();
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly onOpen?: () => void;
  private readonly onClose?: () => void;
  private readonly onHalfOpen?: () => void;

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeout = options.resetTimeout;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onHalfOpen = options.onHalfOpen;
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn The function to execute
   * @returns The result of the function
   * @throws Error if the circuit is open or the function fails
   */
  async fire<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() > this.nextAttempt) {
        // Move to half-open state to test if the service is back
        this.state = CircuitState.HALF_OPEN;
        if (this.onHalfOpen) {
          this.onHalfOpen();
        }
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      
      // If the call was successful, reset the circuit
      this.success();
      return result;
    } catch (error) {
      // If the call failed, record the failure
      this.failure();
      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  private success(): void {
    // Reset failure count and move to closed state if not already
    this.failureCount = 0;
    
    if (this.state !== CircuitState.CLOSED) {
      this.state = CircuitState.CLOSED;
      if (this.onClose) {
        this.onClose();
      }
    }
  }

  /**
   * Record a failed operation
   */
  private failure(): void {
    this.failureCount++;
    
    if (this.failureCount >= this.failureThreshold) {
      // Open the circuit
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
      
      if (this.onOpen) {
        this.onOpen();
      }
    }
  }

  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get the current failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Reset the circuit to closed state
   */
  reset(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    if (this.onClose) {
      this.onClose();
    }
  }
}
