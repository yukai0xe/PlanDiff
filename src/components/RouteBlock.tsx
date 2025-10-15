import type React from "react";
import { useRouteStore } from "@/store/routeStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface RouteBlockProps {
    route: Route;
    dayIdx?: number;
    children?: React.ReactNode
}

const RouteBlock = ({ route, dayIdx, children }: RouteBlockProps) => {
    const { createNewMapping, updateMappingFriend, toggleMapping, getTopRecordFriend, routesMapping, routes} = useRouteStore();
    const [selected, setSelected] = useState<(RecordPoint & {color: string})[]>([]);
    const dayRecords = dayIdx !== undefined ? Object.values(route.days)[dayIdx] : Object.values(route.days).flatMap(r => r);
    const checkSelected = (record: RecordPoint) => {
        if (!selected) return false;
        return selected.some(s => s.id === record.id && s.point === record.point);
    }
    const getSelectedColor = (record: RecordPoint) => {
        return selected.find(s => s.id === record.id && s.point === record.point)?.color || "";
    }
    const checkTopSelector = (record: RecordPoint) => {
        if (route.id !== routes[0].id || routesMapping.stack.length === 0) return false;
        const topRecord = routesMapping.stack[routesMapping.stack.length - 1];
        return topRecord.id === record.id && topRecord?.point === record.point;
    }
    const getTag = (record: RecordPoint) => {
        const mapping = routesMapping.mapping.find(el => el.friend[route.id]?.id === record.id && el.friend[route.id]?.point === record.point);
        if (!mapping) return "";
        let dayIdx = 1;
        for (let [_, dayRecord] of Object.entries(routes[0].days)) {
            const pointIdx = dayRecord.findIndex(r => mapping?.mainRecord.id === r.id && mapping?.mainRecord.point === r.point);
            if (pointIdx === -1) dayIdx++;
            else return `${dayIdx}-${pointIdx + 1}`;
        }
        return "";
    }

    const handleClick = (record: RecordPoint) => {
        if (route.id === routes[0].id) {
            if (checkSelected(record)) {
                setSelected(selected.filter(s => s.id !== record.id && s.point !== record.point));
                toggleMapping(record);
            }
            else {
                if (!routesMapping.mapping.some(el => el.mainRecord.id === record.id && el.mainRecord.point === record.point)) {
                    createNewMapping(record);
                }
                const color = toggleMapping(record);
                setSelected([...selected, {
                    ...record,
                    color
                }]);
            }
        } else {
            const allFriendRecord = routesMapping.mapping.flatMap(el => Object.values(el.friend));
            if (allFriendRecord.includes(record) && !Object.values(getTopRecordFriend()).includes(record)) {
                toast.error("不能選取已被分配的紀錄點");
                return;
            }
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
        if (route.id === routes[0].id) return;
        const clickRecords = routesMapping.mapping.filter(el => el.isClick);
        const newSelected = clickRecords
            .filter(r=> r.friend[route.id] !== null)
            .map(r => ({
                ...r.friend[route.id]!,
                color: r.color
            }))
        setSelected(newSelected);
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
                                        <div className={`absolute w-[50px] z-0 top-[5px] bg-red-500 text-white text-[10px] text-right font-semibold px-2 py-[1px] rounded-full shadow-sm`}
                                            style={{right: (-15 - 4 * tag.length) + "px"}}
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
