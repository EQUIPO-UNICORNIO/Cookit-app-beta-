import { useState, useEffect } from 'react';

const devices = [
  { key: 'mobile', label: 'Móvil', width: 390, icon: 'phone_iphone' },
  { key: 'tablet', label: 'Tablet', width: 768, icon: 'tablet' },
  { key: 'desktop', label: 'Escritorio', width: null, icon: 'desktop_windows' },
];

export default function PreviewToggle({ children }) {
  const [active, setActive] = useState(false);
  const [device, setDevice] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('preview_device') || null;
  });

  useEffect(() => {
    if (device) localStorage.setItem('preview_device', device);
    else localStorage.removeItem('preview_device');
  }, [device]);

  const current = devices.find(d => d.key === device);

  return (
    <>
      {current ? (
        <div className="fixed inset-0 z-[100] overflow-auto bg-gray-300 dark:bg-gray-800 py-16">
          <div className="relative mx-auto bg-page min-h-[calc(100vh-8rem)] shadow-2xl border-x-2 border-black/10 rounded-t-xl overflow-hidden transition-all duration-300"
            style={{ maxWidth: current.width ? `${current.width}px` : '100%' }}>
            <div className="h-5 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center px-3 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            {children}
          </div>
        </div>
      ) : (
        children
      )}
      <div className="fixed bottom-24 md:bottom-4 right-4 z-[110]">
        {!active ? (
          <button
            onClick={() => setActive(true)}
            className="bg-primary-600 text-white rounded-full p-2.5 shadow-lg hover:bg-primary-700 transition-all"
            title="Vista previa responsive"
          >
            <span className="material-symbols-outlined text-lg">devices</span>
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-1">
            {devices.map(d => (
              <button
                key={d.key}
                onClick={() => setDevice(device === d.key ? null : d.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  device === d.key
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-base">{d.icon}</span>
                {d.label}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => { setDevice(null); setActive(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">close</span>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </>
  );
}
