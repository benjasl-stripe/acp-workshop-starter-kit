export interface Config {
  lambdaEndpoint: string;
  workshopSecret: string;
  productsApiUrl: string;
  testMode: boolean;
}

export function getConfig(): Config {
  if (typeof window === 'undefined') {
    return {
      lambdaEndpoint: '',
      workshopSecret: '',
      productsApiUrl: '',
      testMode: false,
    };
  }

  return {
    lambdaEndpoint: localStorage.getItem('lambdaEndpoint') || '',
    workshopSecret: localStorage.getItem('workshopSecret') || '',
    productsApiUrl: localStorage.getItem('productsApiUrl') || '',
    testMode: localStorage.getItem('testMode') === 'true',
  };
}

export function saveConfig(config: Config): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('lambdaEndpoint', config.lambdaEndpoint);
  localStorage.setItem('workshopSecret', config.workshopSecret);
  localStorage.setItem('productsApiUrl', config.productsApiUrl);
  localStorage.setItem('testMode', config.testMode ? 'true' : 'false');
}

