import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { FiHome, FiSearch, FiUsers, FiUserPlus } from 'react-icons/fi';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/search', icon: FiSearch, label: 'Search' },
    { path: '/friends', icon: FiUsers, label: 'Friend List' },
    { path: '/requests', icon: FiUserPlus, label: 'Friend Requests' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-[10%] min-w-[80px] h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-orange-500/30 flex flex-col items-center py-6 shadow-[0_0_20px_rgba(251,146,60,0.3)]">
      <div className="mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/50">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative group w-14 h-14 flex items-center justify-center rounded-xl transition-all duration-300 ${
                active
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50'
                  : 'bg-gray-800/50 hover:bg-gray-700/70 border border-gray-700 hover:border-orange-500/50'
              }`}
              title={item.label}
            >
              <Icon
                className={`text-2xl transition-all duration-300 ${
                  active ? 'text-white' : 'text-gray-400 group-hover:text-orange-400'
                }`}
              />
              {active && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-l-full shadow-lg shadow-orange-500/50" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-lg shadow-blue-500/30 hover:border-blue-400 transition-all duration-300">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-full h-full',
                userButtonPopoverCard: 'bg-gray-800 border border-gray-700',
                userButtonPopoverActionButton: 'hover:bg-gray-700',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
