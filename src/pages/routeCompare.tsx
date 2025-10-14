import React, { useEffect, useState, useRef } from "react";
import FunctionalDialog from "@/components/FunctionalDialog";
import TabsSelector from "@/components/TabsSelector";
import { useNavigate } from "react-router-dom";
import { useRouteStore } from "@/store/routeStore";
import { motion, AnimatePresence } from "framer-motion";

interface EditableCellProps {
    arrive?: string;
    depart?: string;
    rest?: number;
    duration?: number;
    compareDetail?: string;
    style?: React.CSSProperties;
    onChange: (
        res:
            | { field: "depart"; value: string }
            | { field: "arrive"; value: string }
            | { field: "duration"; value: number }
            | { field: "rest"; value: number }
            | { field: "compareDetail"; value: string }
    ) => void;
    onBlur: (e: MouseEvent) => void;
}

interface EditableCell {
    isDuration: boolean;
    date: string;
    routeId: string;
    pointId: string;
}

const EditableCell = ({
    arrive,
    depart,
    rest,
    duration,
    compareDetail,
    style,
    onChange,
    onBlur,
}: EditableCellProps) => {
    const [arriveVal, setArriveVal] = useState<string | null>(arrive ?? null);
    const [departVal, setDepartVal] = useState<string | null>(depart ?? null);
    const [restVal, setRestVal] = useState<string | null>(rest?.toString() ?? null);
    const [durationVal, setDurationVal] = useState<string | null>(duration?.toString() ?? null);
    const [compareDetailVal, setCompareDetailVal] = useState<string | null>(compareDetail ?? null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleMouseDownOutside(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onBlur(e);
                useEffect(() => {
                    
                }, []);
            }
        }
        document.addEventListener("mousedown", handleMouseDownOutside);
        return () => document.removeEventListener("mousedown", handleMouseDownOutside);
    }, [arriveVal, departVal, restVal, onChange, onBlur]);

    return (
        <motion.div
            key="editable-cell"
            initial={{
                opacity: 0,
                scale: 0.9,
                y: -8,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{
                duration: 0.2,
                ease: "easeOut",
            }}
            style={style}
            className="flex flex-col gap-y-1 fixed bg-white p-2 border border-gray-300 shadow-lg z-10 mt-2"
            tabIndex={-1}
            ref={popupRef}
            onClick={(e) => e.stopPropagation()}
        >
            {arriveVal != null && (
                <label className="flex items-center text-sm">
                    預計抵達時間：
                    <input
                        type="text"
                        value={arriveVal}
                        onChange={(e) => {
                            setArriveVal(e.target.value);
                            onChange({
                                field: "arrive",
                                value: e.target.value,
                            });
                        }}
                        className="bg-transparent w-36 py-1 px-2 m-0 text-sm border border-solid shadow-sm outline-none"
                    />
                </label>
            )}
            {departVal != null && (
                <label className="flex items-center text-sm">
                    預計出發時間：
                    <input
                        type="text"
                        value={departVal}
                        onChange={(e) => {
                            setDepartVal(e.target.value);
                            onChange({
                                field: "depart",
                                value: e.target.value,
                            });
                        }}
                        className="bg-transparent w-36 py-1 px-2 m-0 text-sm border border-solid shadow-sm outline-none"
                    />
                </label>
            )}
            {durationVal != null && (
                <label className="flex items-center text-sm">
                    預計行進時間：
                    <input
                        type="text"
                        value={durationVal}
                        onChange={(e) => {
                            setDurationVal(e.target.value);
                            onChange({
                                field: "duration",
                                value: Number(e.target.value),
                            });
                        }}
                        className="bg-transparent w-36 py-1 px-2 m-0 text-sm border border-solid shadow-sm outline-none"
                    />
                </label>
            )}
            {restVal != null && (
                <label className="flex items-center text-sm">
                    預計休息時間(分鐘)：
                    <input
                        type="text"
                        value={restVal}
                        onChange={(e) => {
                            setRestVal(e.target.value);
                            if (arriveVal)
                                onChange({
                                    field: "rest",
                                    value: Number(e.target.value),
                                });
                        }}
                        className="bg-transparent w-36 py-1 px-2 m-0 text-sm border border-solid shadow-sm outline-none"
                    />
                </label>
            )}
            {compareDetailVal != null && (
                <label className="flex flex-col gap-y-2 text-sm">
                    備註：
                    <textarea
                        itemID="compareDetail"
                        value={compareDetailVal}
                        onChange={(e) => {
                            const target = e.target;
                            target.style.height = "auto";
                            target.style.height = `${target.scrollHeight}px`;

                            setCompareDetailVal(target.value);
                            onChange({
                                field: "compareDetail",
                                value: target.value,
                            });
                        }}
                        rows={1}
                        className="bg-transparent block w-full py-1 px-2 m-0 text-sm border border-solid shadow-sm outline-none resize-none overflow-hidden break-words"
                        style={{
                            width: "100%", // 固定寬度
                            maxWidth: "100%", // 不允許撐開父層
                            whiteSpace: "pre-wrap", // 自動換行
                            wordBreak: "break-word", // 避免撐開
                            overflowWrap: "break-word",
                            overflowX: "hidden", // 防止水平滾動
                            boxSizing: "border-box",
                        }}
                        ref={(el) => {
                            if (el) {
                                el.style.height = "auto";
                                el.style.height = `${el.scrollHeight}px`;
                            }
                        }}
                    />
                </label>
            )}
        </motion.div>
    );
}

const RouteComparePage = () => {
    const { handleTimeChange } = useRouteStore();
    const data = useRouteStore((state) => state.routes);
    const dayTablesData = useRouteStore((state) => state.routesCompare);
    const [tabs, setTabs] = useState([""]);
    const [activeTab, setActiveTab] = useState(0);
    const navigate = useNavigate();
    const [editing, setEditing] = useState<EditableCell | null>(null);

    const isEditing = (routeId?: string, pointId?: string) => {
        return (
            editing?.routeId === routeId &&
            editing?.pointId === pointId
        );
    }

    const editHandler = (editCell: EditableCell | null) => {
        if (editCell === null) setEditing(null);
        else {
            setEditing(editCell);
        }
    };

    const closeHandler = (e: MouseEvent) => {
        const td = (e.target as HTMLElement).closest("td[data-type='content']");
        if (!td) setEditing(null);
    };

    const saveRoutes = (
        route: Partial<Exclude<RecordPoint, "id" | "point" | "note">>
    ) => {
        if (!editing) return;
        (["arrive", "depart", "rest", "duration", "compareDetail"] as const).forEach(
            (field) => {
                const value = route[field];
                if (value !== undefined && value !== null) {
                    handleTimeChange(
                        {
                            field,
                            date: editing.date,
                            routeId: editing.routeId,
                            pointId: editing.pointId,
                        },
                        value
                    );
                }
            }
        );
    };

    const checkFirstPoint = (pointId: string, routeIdx: number, date: string) => {
        const firstPointId = data[routeIdx].days[date][0].id;
        return pointId === firstPointId;
    }

    const checkLastPoint = (pointId: string, routeIdx: number, date: string) => {
        const dayPoints = data[routeIdx].days[date];
        const lastPointId = dayPoints[dayPoints.length - 1].id;
        return pointId === lastPointId;
    }
    
    useEffect(() => {
        setTabs(dayTablesData.map((_, idx) => "Day" + (idx + 1)));
    }, [dayTablesData]);

    return (
        <div className="min-h-screen p-6 bg-gray-50 shadow-2xl mb-12">
            <div className="w-full flex gap-x-5 items-center justify-between mb-4">
                <div className="flex gap-x-5 items-center">
                    <h1 className="text-2xl font-bold">行程比較表</h1>
                    <TabsSelector tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                <div className="flex gap-x-2 items-center">
                    <button className="px-4 py-2 rounded bg-amber-200 text-gray-800 hover:bg-amber-300"
                        onClick={() => navigate("/mapping")}>調整行程比較</button>
                    <button className="px-4 py-2 rounded bg-amber-200 text-gray-800 hover:bg-amber-300"
                        onClick={() => navigate("/")}>返回行程總覽</button>
                    <FunctionalDialog />
                </div>
            </div>
            {dayTablesData.length === 0 ? (
                <div className="flex flex-col text-center gap-y-5 ">
                    <p className="text-5xl">無行程資料</p>
                </div>
            ) : (
                <>
                    <h2 className="text-xl pt-4 pb-2">{dayTablesData[activeTab].day}</h2>
                    <div className="h-100 overflow-visible">
                        <table
                            className="min-w-full table-fixed border-collapse border border-gray-200 text-sm overflow-visible"
                            style={{ tableLayout: "fixed", width: "100%" }}
                            >
                                <colgroup>
                                    <col className="w-[15%]" />
                                    {data.map((_, idx) => (
                                        <col key={idx} style={{ width: `${85 / data.length}%` }} />
                                    ))}
                                </colgroup>
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="px-4 py-2 border">紀錄點</th>
                                    {data.map((_, idx) => (
                                        <th key={idx} className="px-4 py-2 border">
                                            {idx === 0 ? "預計行程" : `參考行程 ${idx}`}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-gray-200">
                                    <td className="px-4 py-2 border text-lg w-[300px]">人數</td>
                                    {data.map((route, routeIdx) => (
                                        <td key={routeIdx} className="px-4 py-2 border text-lg w-[300px]">{route.teamSize}</td>
                                    ))}
                                </tr>
                                <tr className="hover:bg-gray-200">
                                    <td className="px-4 py-2 border text-lg w-[300px]">天氣</td>
                                    {data.map((route, routeIdx) => (
                                        <td key={routeIdx} className="px-4 py-2 border text-lg w-[300px]">{route.weather}</td>
                                    ))}
                                </tr>
                                {dayTablesData[activeTab].dayPoints.map((row, rowIdx) => (
                                    <React.Fragment key={rowIdx}>
                                        <tr key={row.point} className="hover:bg-gray-200">
                                            <td className="px-4 py-2 border text-lg w-[300px]">
                                                {row.point}
                                            </td>
                                            {row.routes.map((route, routeIdx) => (
                                                <td
                                                    data-type="content"
                                                    key={`${routeIdx}-${rowIdx}`}
                                                    className={`px-4 py-2 cursor-pointer w-[250px] relative ${route &&
                                                            isEditing(route.routeId, route.id) &&
                                                            !editing?.isDuration
                                                            ? "border-blue-500 border-2"
                                                            : "border"
                                                        }`}
                                                    onClick={() => {
                                                        editHandler(
                                                            route
                                                                ? {
                                                                    isDuration: false,
                                                                    date: route.date,
                                                                    routeId: route.routeId,
                                                                    pointId: route.id,
                                                                }
                                                                : null
                                                        );
                                                    }}
                                                    style={{
                                                        wordBreak: "break-word",
                                                        whiteSpace: "pre-wrap",
                                                        overflowWrap: "break-word",
                                                        verticalAlign: "top",
                                                    }}
                                                >
                                                    {route ? (
                                                        <>
                                                            <div className="space-y-1">
                                                                <div
                                                                    title={`抵達時間 ${rowIdx === 0 ? route.depart : route.arrive
                                                                        }${rowIdx !== 0 && route.rest > 0
                                                                            ? ` 休 ${route.rest}'`
                                                                            : ""
                                                                        }`}
                                                                >
                                                                    {checkFirstPoint(route.id, routeIdx, route.date) || rowIdx === 0 ? route.depart : route.arrive}{" "}
                                                                    {rowIdx !== 0 &&
                                                                        route.rest > 0 &&
                                                                        `(休 ${route.rest}')`}{" "}
                                                                    {route.compareDetail}
                                                                </div>
                                                            </div>

                                                            <AnimatePresence>
                                                                {!editing?.isDuration &&
                                                                    isEditing(route?.routeId, route?.id) && (
                                                                        <EditableCell
                                                                            arrive={
                                                                                rowIdx !== 0 ? route.arrive : undefined
                                                                            }
                                                                            depart={
                                                                                rowIdx === 0 ? route.depart : undefined
                                                                            }
                                                                            rest={
                                                                                rowIdx !==
                                                                                    dayTablesData[activeTab].dayPoints
                                                                                        .length -
                                                                                    1 && rowIdx !== 0
                                                                                    ? route.rest
                                                                                    : undefined
                                                                            }
                                                                            style={{
                                                                                position: "absolute",
                                                                                top: "100%",
                                                                                left: 0,
                                                                                width: "100%",
                                                                            }}
                                                                            compareDetail={route.compareDetail}
                                                                            onChange={(res) =>
                                                                                saveRoutes({ [res.field]: res.value })
                                                                            }
                                                                            onBlur={(e) => closeHandler(e)}
                                                                        />
                                                                    )}
                                                            </AnimatePresence>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>

                                        {rowIdx !==
                                            dayTablesData[activeTab].dayPoints.length - 1 && (
                                                <tr className="hover:bg-gray-200">
                                                    <td className="px-4 py-2 border text-xs"></td>
                                                    {row.routes.map((route, routeIdx) => (
                                                        <td
                                                            data-type="content"
                                                            key={routeIdx}
                                                            className={`px-4 py-2 border cursor-pointer relative ${route &&
                                                                    isEditing(route.routeId, route.id) &&
                                                                    editing?.isDuration
                                                                    ? "border-blue-500 border-2"
                                                                    : "border"
                                                                }`}
                                                            onClick={() => {
                                                                editHandler(
                                                                    route
                                                                        ? {
                                                                            isDuration: true,
                                                                            date: route.date,
                                                                            routeId: route.routeId,
                                                                            pointId: route.id,
                                                                        }
                                                                        : null
                                                                );
                                                            }}
                                                        >
                                                            {(route && !checkLastPoint(route.id, routeIdx, route.date)) ? (
                                                                <>
                                                                    <div className="space-y-1">
                                                                        <div>
                                                                            {route.duration}
                                                                            {"'"}
                                                                        </div>
                                                                    </div>
                                                                    <AnimatePresence>
                                                                        {editing?.isDuration &&
                                                                            isEditing(route?.routeId, route?.id) && (
                                                                                <EditableCell
                                                                                    duration={route.duration}
                                                                                    style={{
                                                                                        position: "absolute",
                                                                                        top: "100%",
                                                                                        left: 0,
                                                                                        width: "100%",
                                                                                    }}
                                                                                    onChange={(res) =>
                                                                                        saveRoutes({
                                                                                            [res.field]: res.value,
                                                                                        })
                                                                                    }
                                                                                    onBlur={(e) => closeHandler(e)}
                                                                                />
                                                                            )}
                                                                    </AnimatePresence>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default RouteComparePage;
