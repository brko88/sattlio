import axios from "axios";

const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — dodaje access token na svaki request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — automatski refresh kad token istekne
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

/**
 * Normalizuje error.response.data.detail u citljiv string PRIJE nego bilo koja
 * stranica pozove err.response?.data?.detail (obrazac koriscen na 30+ mjesta
 * u aplikaciji). Backend uvijek vraca JSON sa .detail (vidi RequestValidationError
 * handler u app/main.py) - ali reverse proxy ISPRED backenda (nginx, buduci
 * load balancer) moze odbiti zahtjev prije nego stigne do backenda i vratiti
 * golu HTML stranicu (npr. 413 kad fajl pređe client_max_body_size). Bez ovoga
 * korisnik vidi generican "Greska prilikom uploada" bez pravog razloga - tacno
 * ovo se desilo sa cover slikom (nginx default limit 1MB, backend dozvoljava 5MB).
 */
function friendlyDetailForStatus(status: number | undefined): string {
  if (status === 413) {
    return "Fajl je prevelik za slanje. Pokušajte sa manjom slikom.";
  }
  if (status === 502 || status === 503 || status === 504) {
    return "Server je trenutno nedostupan. Pokušajte ponovo za par sekundi.";
  }
  if (status) {
    return `Greška servera (${status}). Pokušajte ponovo.`;
  }
  return "Nema odgovora servera. Provjerite internet konekciju.";
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && typeof error.response.data?.detail !== "string") {
      // .data je HTML string, prazan, ili objekat bez .detail — zamijeni
      // citljivom porukom da je err.response.data.detail UVIJEK string.
      error.response.data = {
        ...(typeof error.response.data === "object" ? error.response.data : {}),
        detail: friendlyDetailForStatus(error.response.status),
      };
    }

    const originalRequest = error.config;

    // Ako nije 401 ili je već retry — ne pokušavaj refresh
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Ne pokušavaj refresh na auth rutama
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    // Ako je već u toku refresh — stavi request u queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh token je httpOnly cookie - salje se automatski, ne cita se
      // iz localStorage-a.
      const response = await axios.post(
        "/api/v1/auth/refresh",
        {},
        { withCredentials: true }
      );

      const newAccessToken = response.data.access_token;

      localStorage.setItem("access_token", newAccessToken);

      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh nije uspio — odjavi korisnika
      processQueue(refreshError, null);
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;