import { useEffect, useReducer, useRef } from "react";
import { useContext } from "react";
import { createContext } from "react";

const context = createContext();

export function QueryClientProvider({ children, client }) {
  useEffect(() => {
    const onFocus = () => {
      client.queries.forEach((query) => {
        query.subscribers.forEach((subscriber) => subscriber.fetch());
      });
    };

    window.addEventListener("visibilitychange", onFocus, false);
    window.addEventListener("focus", onFocus, false);

    return () => {
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [client]);
  return <context.Provider value={client}>{children}</context.Provider>;
}

export class QueryClient {
  constructor() {
    this.queries = [];
    this.subscribers = [];
  }

  getQuery = (options) => {
    const queryHash = JSON.stringify(options.queryKey);
    let query = this.queries.find((q) => q.queryHash === queryHash);

    if (!query) {
      query = createQuery(this, options);
      this.queries.push(query);
    }

    return query;
  };

  subscribe = (callback) => {
    this.subscribers.push(callback);

    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  };

  notify = () => {
    this.subscribers.forEach((cb) => cb());
  };
}

export function useQuery({ queryKey, queryFn, staleTime, cacheTime }) {
  const client = useContext(context);

  const [, rerender] = useReducer((s) => s + 1, 0);

  const observerRef = useRef(null);
  if (!observerRef.current) {
    observerRef.current = createQueryObserver(client, {
      queryKey,
      queryFn,
      staleTime,
      cacheTime,
    });
  }

  useEffect(() => {
    return observerRef.current.subscribe(rerender);
  }, []);

  return observerRef.current.getResult();
}

function createQuery(client, { queryKey, queryFn, cacheTime = 5 * 60 * 1000 }) {
  const query = {
    queryKey,
    queryHash: JSON.stringify(queryKey),
    promise: null,
    subscribers: [],
    gcTimeout: null,
    state: {
      isLoading: true,
      isError: false,
      error: undefined,
      data: undefined,
      isFetching: true,
    },
    subscribe: (subscriber) => {
      query.subscribers.push(subscriber);

      query.unScheduleGC();

      return () => {
        query.subscribers = query.subscribers.filter((s) => s !== subscriber);

        if (query.subscribers.length === 0) {
          query.scheduleGC();
        }
      };
    },
    scheduleGC: () => {
      query.gcTimeout = setTimeout(() => {
        client.queries = client.queries.filter((q) => q !== query);
        client.notify();
      }, cacheTime);
    },
    unScheduleGC: () => {
      clearTimeout(query.gcTimeout);
    },
    setState: (updater) => {
      query.state = updater(query.state);
      query.subscribers.forEach((subscriber) => subscriber.notify());
      client.notify();
    },
    fetch: () => {
      if (!query.promise) {
        query.promise = (async () => {
          query.setState((state) => ({
            ...state,
            isFetching: true,
            error: undefined,
          }));
          try {
            const data = await queryFn();
            query.setState((state) => ({
              ...state,
              isLoading: false,
              lastUpdated: Date.now(),
              data,
            }));
          } catch (error) {
            query.setState((state) => ({
              ...state,
              isLoading: false,
              isError: true,
              error,
            }));
          } finally {
            query.promise = null;
            query.setState((state) => ({ ...state, isFetching: false }));
          }
        })();
      }

      return query.promise;
    },
  };

  return query;
}

function createQueryObserver(
  client,
  { queryKey, queryFn, staleTime = 0, cacheTime }
) {
  const query = client.getQuery({ queryKey, queryFn, cacheTime });

  const observer = {
    notify: () => {},
    getResult: () => query.state,
    subscribe: (callback) => {
      observer.notify = callback;
      const unsubscribe = query.subscribe(observer);

      observer.fetch();

      return unsubscribe;
    },
    fetch: () => {
      if (
        !query.state.lastUpdated ||
        Date.now() - query.state.lastUpdated > staleTime
      ) {
        query.fetch();
      }
    },
  };

  return observer;
}

export function ReactQueryDevtools() {
  const client = useContext(context);
  const [, rerender] = useReducer((s) => s + 1, 0);

  useEffect(() => {
    return client.subscribe(rerender);
  });

  return (
    <div className="bg-black text-white divide-solid divide-y-2 divide-gray-800">
      {[...client.queries]
        .sort((a, b) => a.queryHash.localeCompare(b.queryHash))
        .map((query) => (
          <div key={query.queryHash} className="p-2">
            {JSON.stringify(query.queryKey, null, 2)} -{" "}
            {console.log(query.queryKey, query.state.isFetching)}
            <span className="font-bold">
              {query.state.isFetching ? (
                <span className="text-blue-500">fetching</span>
              ) : !query.subscribers?.length ? (
                <span className="text-red-500">inactive</span>
              ) : query.state.isError ? (
                <span className="text-green-500">error</span>
              ) : (
                <span className="text-yellow-500">success</span>
              )}
            </span>
          </div>
        ))}
    </div>
  );
}
