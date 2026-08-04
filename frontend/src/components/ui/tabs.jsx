import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const TabsContext = React.createContext(null);

const Tabs = ({ value, onValueChange, children, className }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className }) => {
  return (
    <div
      role="tablist"
      className={cn(
        'relative flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1.5',
        className
      )}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, children, icon: Icon, count, className }) => {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap',
        isActive
          ? 'text-white'
          : 'text-slate-600 dark:text-slate-300 hover:text-police-navy dark:hover:text-police-cyan',
        className
      )}
    >
      {isActive && (
        <motion.span
          layoutId="tabs-active-pill"
          className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-police-navy to-police-cyan shadow-md"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {typeof count === 'number' && count > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold',
            isActive
              ? 'bg-white/25 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
};

const TabsContent = ({ value, children, className }) => {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className={cn('mt-4', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
