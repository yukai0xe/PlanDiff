import FunctionalDialog from "@/components/FunctionalDialog";
import TabsSelector from "@/components/TabsSelector";
import RouteBlock from "@/components/RouteBlock";
import { useState, useEffect } from "react";
import { useRouteStore } from "@/store/routeStore";
import { numberToChinese } from "@/lib/utility";
import Selector from "@/components/Selector";

const RouteMappingPage = () => {
    const { routes } = useRouteStore();
    const [routeView, setRouteView] = useState<Route[]>(routes.slice(0, 5));
    const [dayTabs, setDayTabs] = useState<string[]>([""]);
    const [routeTabs, setRoutesTabs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<number>(0);

    const handleChangeRoute = (route: string, idx: number) => {
        const newRouteView = routeView.map((r, rIdx) => {
            if (rIdx === idx) {
                const newRouteIdx = routeTabs.findIndex(r => r === route);
                return routes[newRouteIdx];
            }
            return r;
        })
        setRouteView(newRouteView);
    }

    useEffect(() => {
        setDayTabs(Object.keys(routes[0].days).map((_, idx) => "Day" + (idx + 1)));
        setRoutesTabs(routes.map((_, idx) => {
            if (idx === 0) return "預定行程";
            return "參考行程" + numberToChinese(idx);
        }
        ));
    }, [routes]);

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-white p-6 shadow-2xl">
            <div className="flex pb-4 justify-between items-center">
                <div className="flex gap-x-5 items-center">
                    <h1 className="text-2xl font-bold">連結預計行程與參考行程</h1>
                    <TabsSelector activeTab={activeTab} setActiveTab={setActiveTab} tabs={dayTabs} />
                </div>
                <div className="">
                    <FunctionalDialog />
                </div>
            </div>
            <div className="flex justify-around">
                {routeTabs.length > 0 && routeView.map((route, idx) => {
                    if (idx === 0) return (
                        <RouteBlock key={idx} route={route} dayIdx={activeTab}>
                            <div className="mb-2 text-left">
                                <h3 className="text-sm font-semibold text-gray-800">{routeTabs[idx]}</h3>
                            </div>
                        </RouteBlock>
                    ) 
                    return (
                        <RouteBlock key={idx} route={route}>
                            <Selector tabs={routeTabs.slice(1)} selectedTab={routeTabs[idx]} onChange={(v) => handleChangeRoute(v, idx)} />
                        </RouteBlock>
                    )
                })}
            </div>
        </div>
    )
}

export default RouteMappingPage;