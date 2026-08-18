// ============================================================
// DONWEB NATIVE API CLIENT (SPINAZ GARAGE - ISOLATED BACKEND)
// ============================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_DONWEB_API_URL || 'https://l1deres.site/spinaz';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'driver';
  phone?: string;
  dni?: string;
  vehicle_id?: string;
  metrics?: Record<string, any>;
}

export interface AuthSession {
  access_token: string;
  user: UserProfile;
}

const SESSION_KEY = 'spinaz_donweb_session';

export const donwebAuth = {
  async signInWithPassword({ email, password }: { email: string; password?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { data: null, error: { message: data.error || 'Error de inicio de sesión' } };
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      }
      return { data: { session: data.session, user: data.user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Error de conexión con el servidor DonWeb' } };
    }
  },

  async getSession() {
    if (typeof window === 'undefined') return { data: { session: null }, error: null };
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return { data: { session: null }, error: null };
    try {
      const session = JSON.parse(stored);
      return { data: { session }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  },

  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
    return { error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SESSION_KEY);
      const session = stored ? JSON.parse(stored) : null;
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    }
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};

export const donwebStorage = {
  from(_bucketName: string) {
    return {
      async upload(path: string, file: File) {
        try {
          const formData = new FormData();
          formData.append('file', file, path);
          const res = await fetch(`${API_BASE_URL}/upload.php`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            return { data: null, error: { message: data.error || 'Error al subir archivo' } };
          }
          return { data: { path: data.path, fullPath: data.url }, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
      getPublicUrl(path: string) {
        if (path.startsWith('http')) return { data: { publicUrl: path } };
        return { data: { publicUrl: `${API_BASE_URL}/uploads/${path}` } };
      }
    };
  }
};

// ── Query & Mutation Builder con encadenamiento completo (Chaining) ───────────

export function donwebFrom(tableName: string) {
  let endpoint = `${API_BASE_URL}/`;
  
  switch (tableName) {
    case 'profiles': endpoint += 'auth.php?action=list'; break;
    case 'vehicles': endpoint += 'vehicles.php'; break;
    case 'applicants': endpoint += 'applicants.php'; break;
    case 'payments': endpoint += 'payments.php'; break;
    case 'incidents': endpoint += 'incidents.php'; break;
    case 'announcements': endpoint += 'announcements.php'; break;
    case 'benefits': endpoint += 'announcements.php?type=benefits'; break;
    case 'daily_reports': endpoint += 'daily_reports.php'; break;
    case 'service_orders': endpoint += 'taller.php'; break;
    case 'chat_messages': endpoint += 'chat_messages.php'; break;
    default: endpoint += `${tableName}.php`; break;
  }

  const helperFetch = async (queryParams: Record<string, any> = {}): Promise<{ data: any[]; error: any }> => {
    try {
      const url = new URL(endpoint);
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v));
        }
      });

      const res = await fetch(url.toString());
      const d = await res.json();
      if (!res.ok || d.error) {
        return { data: [], error: { message: d.error || `Error HTTP ${res.status}` } };
      }

      const list = d[tableName] || d.chat_messages || d.messages || d.profiles || d.vehicles || d.applicants || d.payments || d.incidents || d.announcements || d.benefits || d.reports || d.orders || d.service_orders || (Array.isArray(d) ? d : [d]);
      return { data: Array.isArray(list) ? list : (list ? [list] : []), error: null };
    } catch (err: any) {
      return { data: [], error: { message: err.message } };
    }
  };

  return {
    select(_columns = '*') {
      const filters: Record<string, any> = {};

      const selectBuilder: any = {
        eq(col: string, val: any) {
          filters[col] = val;
          return selectBuilder;
        },
        neq(col: string, val: any) {
          filters[`not_${col}`] = val;
          return selectBuilder;
        },
        like(col: string, val: any) {
          filters[col] = val;
          return selectBuilder;
        },
        ilike(col: string, val: any) {
          filters[col] = val;
          return selectBuilder;
        },
        in(col: string, vals: any[]) {
          filters[col] = vals.join(',');
          return selectBuilder;
        },
        order(col?: string, _opts?: any) {
          if (col) filters['order_by'] = col;
          return selectBuilder;
        },
        limit(count: number) {
          filters['limit'] = count;
          return selectBuilder;
        },
        async single() {
          const { data, error } = await helperFetch(filters);
          return { data: data[0] || null, error };
        },
        then(resolve: (res: any) => void, reject?: (err: any) => void) {
          return helperFetch(filters).then(resolve, reject);
        }
      };

      return selectBuilder;
    },

    insert(rows: any[]) {
      const payload = Array.isArray(rows) ? rows[0] : rows;
      let targetFile = `${tableName}.php`;
      if (tableName === 'profiles') targetFile = 'auth.php?action=create';
      if (tableName === 'service_orders') targetFile = 'taller.php';

      const execInsert = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/${targetFile}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            return { data: null, error: { message: data.error || 'Error al insertar' } };
          }
          return { data: [data.id ? { id: data.id, ...payload } : payload], error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      };

      const insertBuilder: any = {
        select() {
          return {
            async single() {
              const r = await execInsert();
              return { data: r.data?.[0] || null, error: r.error };
            },
            then(resolve: (res: any) => void, reject?: (err: any) => void) {
              return execInsert().then(resolve, reject);
            }
          };
        },
        then(resolve: (res: any) => void, reject?: (err: any) => void) {
          return execInsert().then(resolve, reject);
        }
      };

      return insertBuilder;
    },

    update(values: any) {
      const updateFilters: Record<string, any> = {};

      const execUpdate = async () => {
        let targetFile = `${tableName}.php`;
        if (tableName === 'profiles') targetFile = 'auth.php?action=update';
        if (tableName === 'service_orders') targetFile = 'taller.php';

        const payload = { ...values, ...updateFilters };
        try {
          const res = await fetch(`${API_BASE_URL}/${targetFile}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            return { data: null, error: { message: data.error || 'Error al actualizar' } };
          }
          return { data: [payload], error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      };

      const updateBuilder: any = {
        eq(col: string, val: any) {
          updateFilters[col] = val;
          return updateBuilder;
        },
        select() {
          return {
            async single() {
              const r = await execUpdate();
              return { data: r.data?.[0] || null, error: r.error };
            },
            then(resolve: (res: any) => void, reject?: (err: any) => void) {
              return execUpdate().then(resolve, reject);
            }
          };
        },
        then(resolve: (res: any) => void, reject?: (err: any) => void) {
          return execUpdate().then(resolve, reject);
        }
      };

      return updateBuilder;
    },

    delete() {
      const deleteFilters: Record<string, any> = {};

      const execDelete = async () => {
        try {
          let url = `${API_BASE_URL}/${tableName}.php`;
          if (tableName === 'profiles') {
            url = `${API_BASE_URL}/auth.php?action=delete`;
          }
          const qParams = new URLSearchParams();
          Object.entries(deleteFilters).forEach(([k, v]) => qParams.set(k, String(v)));
          const separator = url.includes('?') ? '&' : '?';
          const fullUrl = `${url}${separator}${qParams.toString()}`;

          const res = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deleteFilters)
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) {
            return { data: null, error: { message: data.error || `Error al eliminar (${res.status})` } };
          }
          return { data: null, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      };

      const deleteBuilder: any = {
        eq(col: string, val: any) {
          deleteFilters[col] = val;
          return deleteBuilder;
        },
        then(resolve: (res: any) => void, reject?: (err: any) => void) {
          return execDelete().then(resolve, reject);
        }
      };

      return deleteBuilder;
    }
  };
}

export const donwebClientAdapter = {
  auth: donwebAuth,
  storage: donwebStorage,
  from: donwebFrom,
  channel(_name: string) {
    return {
      on(_event: string, _filter: any, _callback: any) {
        return this;
      },
      subscribe() {
        return this;
      }
    };
  },
  removeChannel(_channel: any) {
    return true;
  }
};
