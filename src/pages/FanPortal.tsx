import { ShoppingBag, Users, Navigation } from 'lucide-react';
import type { TelemetryState, Concession } from '../types/telemetry';
import StatsCard from '../components/common/StatsCard';
import { triggerAction } from '../utils/telemetryEngine';

interface FanPortalProps {
  telemetryState: TelemetryState;
}

export default function FanPortal({ telemetryState }: FanPortalProps) {
  const concessions = telemetryState.concessions || [];
  const fanOrders = telemetryState.fanOrders || [];

  const handleOrder = (c: Concession) => {
    triggerAction("ORDER_FOOD", {
      name: c.name,
      seat: "Sec 102, Row D",
      items: ["Fan Special Snack combo"],
      totalCost: 11.50
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50">Fan Matchday Portal</h1>
        <p className="text-xs text-zinc-400">Concessions pre-ordering, custom guides, and maps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Assigned Gate" 
          value="Gate 2" 
          subtext="3 minutes walk to seat"
          badgeText="Green Path"
          badgeStatus="success"
          icon={Navigation}
        />
        <StatsCard 
          title="Assigned Seat" 
          value="Sec 102" 
          subtext="Row D, Seat 14"
          badgeText="Standard"
          badgeStatus="default"
          icon={Users}
        />
        <StatsCard 
          title="Active Orders" 
          value={fanOrders.length.toString()} 
          subtext="Pickup notification will flash"
          badgeText="Real-time"
          badgeStatus="default"
          icon={ShoppingBag}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Concessions list */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Concession Express Pre-ordering</h3>
            <p className="text-[10px] text-zinc-500">Skip the queue. Pick up items instantly when notified.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-850 font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Outlet</th>
                  <th className="py-2.5 px-3">Wait Time</th>
                  <th className="py-2.5 px-3">Menu Item</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {concessions.map(c => (
                  <tr key={c.id} className="hover:bg-zinc-900/10">
                    <td className="py-3 px-3 font-semibold text-zinc-300">{c.name}</td>
                    <td className="py-3 px-3">
                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide ${c.waitTime > 20 ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
                        {c.waitTime} mins
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">Hotdog + Drink Bundle</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">$11.50</td>
                    <td className="py-3 px-3">
                      <button 
                        onClick={() => handleOrder(c)}
                        className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-medium text-[11px] text-zinc-50 hover:bg-zinc-850 transition-colors"
                      >
                        Pre-order Combo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order queue tracking */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Your Orders</h3>
            <p className="text-[10px] text-zinc-500">Live order status and ticket scan codes.</p>
          </div>

          {fanOrders.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs font-mono">
              No orders placed yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {fanOrders.map(order => (
                <div key={order.id} className="rounded border border-zinc-850 p-3 flex flex-col gap-2 bg-zinc-900/10">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-200">{order.name}</span>
                    <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide ${order.status === 'READY_FOR_PICKUP' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Seat: {order.seat} | Cost: ${order.totalCost.toFixed(2)}
                  </div>
                  {order.status === 'READY_FOR_PICKUP' && (
                    <div className="rounded border border-emerald-500/20 bg-emerald-500/5 py-1.5 text-center text-emerald-400 font-bold text-xs tracking-wider">
                      Scan QR Code: {order.id.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
