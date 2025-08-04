import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method, url, data) {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// unauthorizedBehavior: "returnNull" | "throw"
// const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
//   const res = await fetch(queryKey.join("/"), {
//     credentials: "include",
//   });

//   if (unauthorizedBehavior === "returnNull" && res.status === 401) {
//     return null;
//   }

//   await throwIfResNotOk(res);
//   return await res.json();
// };

const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
  const token = sessionStorage.getItem('authToken');
  const headers = {
    credentials: 'include', // for cookies if ever used
    headers: {},
  };
  if (token) {
    headers.headers.Authorization = `Bearer ${token}`;
  }

  const url = queryKey.join('/');
  const res = await fetch(url, {
    method: 'GET',
    ...headers,
  });

  if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
    return null;
  }

  await throwIfResNotOk(res);
  return await res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});