export interface IGenerateTokensResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    exp: number;
    tokenType: string;
    // Otros datos opcionales
    [key: string]: any;
  },
  role: string;
  // Otros datos opcionales
  [key: string]: any;
}