export interface RepositoryStatus<T> {
  data: T;
  source: 'firebase' | 'mock';
  success: boolean;
  error?: any;
}
