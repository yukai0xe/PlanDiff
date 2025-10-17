import type React from "react";
import { useRouteStore } from "@/store/routeStore";
import { useEffect, useState } from "react";

interface RouteBlockProps {
    route: Route;
    dayIdx?: number;
    children?: React.ReactNode
}

const RouteBlock = ({ route, dayIdx, children }: RouteBlockProps) => {
    const { createNewMapping, updateMappingFriend, toggleMapping, routesMapping, routes } = useRouteStore();
    const [selected, setSelected] = useState<(RecordPoint & { color: string })[]>([]);
    const dayRecords = (function () {
        if (dayIdx !== undefined) {
            return Object.values(route.days)[dayIdx].map(item => ({ date: Object.keys(route.days)[dayIdx], ...item }));
        }
        return Object.entries(route.days).flatMap(([date, items]) => items.map((item) => ({ date, ...item })));
    }());
    const checkSelected = (record: RecordPoint) => {
        if (!selected) return false;
        return selected.some(s => s.id === record.id);
    }
    const getSelectedColor = (record: RecordPoint) => {
        return selected.find(s => s.id === record.id)?.color || "";
    }
    const checkTopSelector = (record: RecordPoint) => {
        if (route.id !== routes[0].id || routesMapping.stack.length === 0) return false;
        const topRecord = routesMapping.stack[routesMapping.stack.length - 1];
        return topRecord.id === record.id;
    }
    const getTag = (record: RecordPoint) => {
        const tags = [];
        for (let mapping of routesMapping.mapping) {
            if (mapping.friend[route.id]?.id === record.id) {
                let dayIdx = 1;
                for (let [_, dayRecord] of Object.entries(routes[0].days)) {
                    const pointIdx = dayRecord.findIndex(r => mapping?.mainRecord.id === r.id);
                    if (pointIdx !== -1) tags.push(`${dayIdx}-${pointIdx + 1}`);
                    dayIdx++;
                }
            }
        }
        return tags.join("、");
    }

    const handleClick = (record: (RecordPoint & {date: string})) => {
        if (route.id === routes[0].id) {
            if (checkSelected(record)) {
                setSelected(selected.filter(s => s.id !== record.id));
                toggleMapping(record);
            }
            else {
                if (!routesMapping.mapping.some(el => el.mainRecord.id === record.id)) {
                    createNewMapping(record);
                }
                const color = toggleMapping(record);
                setSelected([...selected, {
                    ...record,
                    color
                }]);
            }
        } else {
            if (checkSelected(record)) {
                setSelected(selected.filter(s => s.id !== record.id && s.point !== record.point));
                updateMappingFriend(route.id, null);
            }
            else {
                const color = updateMappingFriend(route.id, record); 
                if (selected.some(s => s.color === color)) {
                    setSelected([...selected.map(s => {
                        if (s.color === color) {
                            return {
                                ...record,
                                color
                            }
                        }
                        return { ...s };
                    })])
                } else {
                    setSelected([...selected, {
                        ...record,
                        color
                    }]);
                }
            }
        }
        
    }

    useEffect(() => {
        setSelected((() => {
            if (route.id === routes[0].id) {
                return routesMapping.mapping.filter(v => (v.isClick)).map(r => ({
                    ...r.mainRecord,
                    color: r.color
                }))
            }
            else {
                const clickRecords = routesMapping.mapping.filter(el => el.isClick);
                return clickRecords
                    .filter(r => r.friend[route.id] !== null)
                    .map(r => ({
                        ...r.friend[route.id]!,
                        color: r.color
                    }))
            }
        }));
    }, [routesMapping.mapping.map(v => (v?.isClick ? "1" : "0")).join("|")])

    return (
        <div className="inline-block">
            {children}

            <div className="mt-2 rounded-md">
                <div className="space-y-1">
                    {dayRecords.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-gray-500 text-center bg-gray-50 rounded-md">
                            No stops for this day.
                        </div>
                    ) : (
                        dayRecords.map((r, i) => {
                            const tag = getTag(r);
                            return (
                                <div className="relative" key={i} data-id={r.id}>
                                    {(route.id !== routes[0].id) && tag.length > 0 &&
                                        <div className={`absolute z-0 top-[5px] bg-red-500 text-white text-[10px] text-right font-semibold px-2 py-[1px] rounded-full shadow-sm`}
                                            style={{right: (-15 - 5 * tag.length) + "px", width: (50 + 5 * tag.length) + "px"}}
                                        >{tag}</div>
                                    }
                                    <div
                                        className={`relative bg-white z-10 flex items-start hover:bg-gray-50 cursor-pointer rounded-md transition border ${checkSelected(r) ? (checkTopSelector(r) ? 'animate-fade font-bold border-2' : 'border-2') : 'border'}`}
                                        style={{ borderColor: getSelectedColor(r), }}
                                        onClick={() => handleClick(r)}
                                    >
                                        <div className="px-3 py-2 w-10 text-sm text-gray-600 flex-shrink-0">
                                            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                                                {i + 1}
                                            </span>
                                        </div>
                                        <div className="px-2 py-2 text-sm text-gray-800 whitespace-nowrap">
                                            {r.point || <span className="text-gray-400">Unnamed place</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default RouteBlock;
