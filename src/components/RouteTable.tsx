import React, { useEffect, useRef, useState } from "react";
import { LuMapPinPlus, LuTrash2, LuPlus } from "react-icons/lu";
import { v7 as uuidv7 } from "uuid";
import { useRouteStore } from "@/store/routeStore";
import { minutesToTime, timeToMinutes } from "@/lib/utility";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import toast from "react-hot-toast";

const fields = ["point", "arrive", "rest", "depart", "duration", "note"] as const;

type EditCell = {
    field: keyof RecordPoint;
    date: string;
    pointId: string;
    routeId: string;
    idx: number;
};

type FocusCell = {
    field: Exclude<keyof RecordPoint, "id" | "compareDetail">;
    date: string;
    rowIdx: number;
};

const RouteTable: React.FC<{
    data: Route[];
    setData: (routes: Route[]) => void;
    activeTab: number;
}> = ({ data, setData, activeTab }) => {
    const _handleTimeChange = useRouteStore(state => state.handleTimeChange);
    const [editing, setEditing] = useState<EditCell | null>(null);
    const [focus, setFocus] = useState<FocusCell | null>(null);
    const [prevValue, setPrevValue] = useState<string | number>("");
    const inputRef = useRef<HTMLInputElement>(null);
    const tableRefs = useRef<Record<string, HTMLTableElement | null>>({});
    const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

    const handleAddRow = (date: string, rowIdx?: number) => {
        const newData = data.map((route) => {
            const newRoute: Route = {
                ...route,
                days: {}
            }
            for (const date in route.days) {
                newRoute.days[date] = route.days[date].map((r) => ({ ...r }));
            }
            return newRoute;
        });
        const route = { ...newData[activeTab] };
        const rows = [...(route.days[date] || [])];
        const lastRowIdx = rowIdx ?? rows.length - 1;
        debugger;
        if (rows.length > 0) {
            const lastRow = data[activeTab].days[date][lastRowIdx];
            const time =
                lastRow.arrive.length > 0
                    ? minutesToTime(timeToMinutes(lastRow.arrive) + lastRow.rest)
                    : "";
            rows[rowIdx ?? rows.length - 1].depart = time;
            rows.splice(lastRowIdx + 1, 0, {
                id: uuidv7(),
                point: "",
                depart: rows[lastRowIdx].depart,
                arrive: rows[lastRowIdx].depart,
                duration: 0,
                rest: 0,
                note: "",
                compareDetail: "",
            });
            for (let i = lastRowIdx + 1; i < rows.length; i++) {
                rows[i].arrive = minutesToTime(
                    timeToMinutes(rows[i - 1].depart) + rows[i - 1].duration
                );
                rows[i].depart = minutesToTime(
                    timeToMinutes(rows[i].arrive) + rows[i].rest
                );
            }
        } else {
            rows.push({
                id: uuidv7(),
                point: "",
                depart: "12:00",
                arrive: "12:00",
                duration: 0,
                rest: 0,
                note: "",
                compareDetail: "",
            });
        }

        route.days[date] = rows;
        newData[activeTab] = route;
        setData(newData);
    };

    const handleDeleteRow = (date: string, rowIdx: number) => {
        if (!confirm("確定要刪除此列嗎？")) return;
        const newData = data.map((route) => {
            const newRoute: Route = { ...route, days: {} };
            for (const date in route.days) {
                newRoute.days[date] = route.days[date].map((r) => ({ ...r }));
            }
            return newRoute;
        });
        const route = { ...newData[activeTab] };
        const rows = [...(route.days[date] || [])];
        rows.splice(rowIdx, 1);
        if (rowIdx > 0) {
            for (let i = rowIdx; i < rows.length; i++) {
                rows[i].arrive = minutesToTime(
                    timeToMinutes(rows[i - 1].depart) + rows[i - 1].duration
                );
                rows[i].depart = minutesToTime(
                    timeToMinutes(rows[i].arrive) + rows[i].rest
                );
            }
        }
        route.days[date] = rows;
        newData[activeTab] = route;
        setData(newData);
    };

    const handleTimeChange = (cell: EditCell, newValue: string | number) => {
        _handleTimeChange(cell, newValue);
        setEditing(null);
    };

    const checkEditing = (
        pointId: string,
        field: Exclude<keyof RecordPoint, "id">,
        date: string
    ) => {
        return (
            editing?.pointId === pointId &&
            editing?.field === field &&
            editing?.date === date
        );
    };

    const checkFocus = (
        rowIdx: number,
        field: Exclude<keyof RecordPoint, "id">,
        date: string
    ) => {
        return (
            focus?.rowIdx === rowIdx && focus?.field === field && focus?.date === date
        );
    };

    const getRowOffset = () => {
        if (!focus) return 0;
        const table = tableRefs.current[focus.date];
        if (!table) return 0;
        const rows = table.querySelectorAll("tbody tr") as NodeListOf<HTMLElement>;
        const header = table.querySelector("thead") as HTMLElement | null;

        const headerHeight = header?.clientHeight || 0;
        const perviousRowsHeight = Array.from(rows).reduce((acc, r, idx) => {
            if (idx < (focus?.rowIdx ?? 0)) {
                return acc + (r.clientHeight || 0);
            }
            return acc;
        }, 0);
        return headerHeight + perviousRowsHeight;
    };

    const checkEditingEffectCell = (
        date: string,
        rowIdx: number,
        field: Exclude<keyof RecordPoint, "id">
    ) => {
        if (!editing || date !== editing.date || ["point", "note"].includes(editing.field)) return false;
        if (editing.field === "depart" && field === "arrive" && rowIdx === editing.idx) return false;
        if (editing.field === "depart" && field === "rest" && rowIdx === editing.idx) return true;
        if (editing.field === "arrive" && field === "duration" && rowIdx + 1 === editing.idx) return true;
        if (editing.field === "rest" && field === "depart" && rowIdx === editing.idx) return true;
        if (editing.field === "arrive" && field === "depart" && editing.idx === rowIdx) return true;
        if (editing.idx >= rowIdx) return false;
        return ["arrive", "depart"].includes(field);
    }

    useEffect(() => {
        if (focus) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [focus]);

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (!focus || editing || document.activeElement?.tagName == "INPUT") return;
            
            const currentRow = data[activeTab].days[focus.date][focus.rowIdx];
            const value = currentRow[focus.field];

            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                setEditing({
                    pointId: currentRow.id,
                    routeId: data[activeTab].id,
                    field: focus.field,
                    date: focus.date,
                    idx: focus.rowIdx
                });
                setPrevValue(e.key);
                return;
            }

            if (e.key === "Backspace") {
                e.preventDefault();
                if (!focus) return;
                setEditing({
                    pointId: currentRow.id,
                    routeId: data[activeTab].id,
                    field: focus.field,
                    date: focus.date,
                    idx: focus.rowIdx
                });
                setPrevValue(currentRow[focus.field].toString().slice(0, -1));
                return;
            }

            // Delete 或 Backspace：清空目前儲存格內容
            if (e.key === "Delete") {
                e.preventDefault();
                if (!focus) return;

                const cell: EditCell = {
                    pointId: currentRow.id,
                    routeId: data[activeTab].id,
                    field: focus.field,
                    date: focus.date,
                    idx: focus.rowIdx
                };
                if (focus.field === "point" || focus.field === "note") {
                    handleTimeChange(cell, "");
                    toast.success("已清空內容");
                } else {
                    toast.error("此欄位無法清空");
                }
                return;
            }

            // Ctrl + C：複製當前 focus 儲存格內容
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
                e.preventDefault();
                if (value !== undefined) {
                    navigator.clipboard.writeText(String(value));
                    navigator.clipboard.writeText(String(value)).then(() => {
                        toast.success(`已複製：${value}`);
                    });
                }
                return;
            }
            
            // Ctrl + V：貼上剪貼簿文字
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
                e.preventDefault();
                const pasteText = await navigator.clipboard.readText();
                if (pasteText.length > 0) {
                    const cell: EditCell = {
                        pointId: currentRow.id,
                        routeId: data[activeTab].id,
                        field: focus.field,
                        date: focus.date,
                        idx: focus.rowIdx
                    };

                    handleTimeChange(cell, pasteText);
                    toast.success(`已貼上：${pasteText}`);
                }
                return;
            }

            // ✅ Ctrl + X：剪下（複製 + 清空）
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
                e.preventDefault();
                if (value !== undefined) {
                    await navigator.clipboard.writeText(String(value));
                    const cell: EditCell = {
                        pointId: currentRow.id,
                        routeId: data[activeTab].id,
                        field: focus.field,
                        date: focus.date,
                        idx: focus.rowIdx
                    };
                    if(focus.field === "point" || focus.field === "note") handleTimeChange(cell, "");
                    toast.success(`已剪下：${value}`);
                }
                return;
            }

            let nextRow = focus.rowIdx;
            let nextField = focus.field;
            const row_count = data[activeTab].days[focus.date].length;

            if (e.key === "Enter") {
                e.preventDefault();
                nextRow = (focus.rowIdx + 1) % row_count;
                setFocus({ ...focus, rowIdx: nextRow, field: nextField });
            }

            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    nextRow = (focus.rowIdx - 1 + row_count) % row_count;
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    nextRow = (focus.rowIdx + 1) % row_count;
                    break;
                case "ArrowLeft": {
                    e.preventDefault();
                    const idx = fields.indexOf(focus.field);
                    nextField = fields[(idx - 1 + fields.length) % fields.length];
                    break;
                }
                case "ArrowRight": {
                    e.preventDefault();
                    const idx = fields.indexOf(focus.field);
                    nextField = fields[(idx + 1) % fields.length];
                    break;
                }
            }

            setFocus({ ...focus, rowIdx: nextRow, field: nextField });
        };

        const debouncedKeyHandler = debounce((e: KeyboardEvent) => {
            handleKeyDown(e);
        }, 50);

        window.addEventListener("keydown", debouncedKeyHandler);
        return () => {
            window.removeEventListener("keydown", debouncedKeyHandler);
            debouncedKeyHandler.cancel();
        };
    }, [focus]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("tr")) {
                setFocus(null);
                setEditing(null);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!focus) return;
        const key = `${focus.date}-${focus.rowIdx}-${focus.field}`;
        const el = cellRefs.current[key];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
    }, [focus]);

    return (
        <div className="space-y-8 mt-4">
            {Object.entries(data[activeTab]?.days || {}).map(([date, rows]) => (
                <div key={date} className="space-y-2">
                    <div className="flex gap-x-3 items-center">
                        <LuMapPinPlus
                            title="新增記錄點"
                            className="cursor-pointer size-8 p-1 rounded-2xl hover:bg-blue-100"
                            onClick={() => handleAddRow(date)}
                        />
                        <h2 className="text-lg font-semibold text-gray-700">{date}</h2>
                    </div>
                    <div className="relative overflow-visible shadow table-wrapper">
                        {focus && focus.date === date && (
                            <AnimatePresence>
                                {focus && focus.date === date && (
                                    <motion.div
                                        key={`${focus.date}-${focus.rowIdx}`}
                                        className="absolute inline-flex items-center gap-x-1 z-20"
                                        style={{
                                            top: `${getRowOffset()}px`, // 按鈕對應列的垂直位置
                                            left: "-70px",              // 按鈕距離表格的水平偏移
                                        }}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <button
                                            key={`add-${focus.date}-${focus.rowIdx}`}
                                            title="新增一列於下方"
                                            onClick={() => handleAddRow(focus.date, focus.rowIdx)}
                                            className="bg-white border border-gray-300 shadow-md
                                                        rounded-full p-1 z-20 flex items-center justify-center
                                                        text-green-600 hover:text-green-800 hover:bg-green-50
                                                        cursor-pointer"
                                        >
                                            <LuPlus size={18} />
                                        </button>

                                        <button
                                            key={`delete-${focus.date}-${focus.rowIdx}`}
                                            title="刪除此列"
                                            onClick={() => handleDeleteRow(focus.date, focus.rowIdx)}
                                            className="bg-white border border-gray-300 shadow-md
                                                        rounded-full p-1 z-20 flex items-center justify-center
                                                        text-red-600 hover:text-red-800 hover:bg-red-50
                                                        cursor-pointer"
                                        >
                                            <LuTrash2 size={18} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                        <table ref={(el) => { tableRefs.current[date] = el }} className="min-w-full table-fixed border border-gray-200 text-sm">
                            {/* 設定欄位比例 */}
                            <colgroup>
                                <col className="w-[15%]" />
                                <col className="w-[7%]" />
                                <col className="w-[7%]" />
                                <col className="w-[8%]" />
                                <col className="w-[8%]" />
                                <col className="w-[55%]" />
                            </colgroup>

                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-4 py-2 border">記錄點</th>
                                    <th className="px-4 py-2 border">抵達時間</th>
                                    <th className="px-4 py-2 border">休息時間<br />(分鐘)</th>
                                    <th className="px-4 py-2 border">出發時間</th>
                                    <th className="px-4 py-2 border">行進時間<br />(分鐘)</th>
                                    <th className="px-4 py-2 border">備註</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, rowIdx) => {
                                    const isFocusedRow =
                                        focus && focus.date === date && focus.rowIdx === rowIdx;
                                    return (
                                    <tr
                                        key={row.id}
                                        className={`relative hover:bg-gray-200 transition-colors ${isFocusedRow ? "bg-blue-50" : ""}`}
                                    >
                                            {fields.map((field) => {
                                            const key = `${date}-${rowIdx}-${field}`;
                                            const isStrike =
                                                (rowIdx === 0 &&
                                                    (field === "arrive" || field === "rest")) ||
                                                (rowIdx === rows.length - 1 &&
                                                    (field === "depart" ||
                                                        field === "rest" ||
                                                        field === "duration"));
                                            if (isStrike) {
                                                return (
                                                    <td
                                                        key={date + "-" + field}
                                                        className={`px-4 py-2 border cursor-pointer h-[35px] relative border`}
                                                        onClick={() => {
                                                            setEditing(null);
                                                            setFocus(null);
                                                        }}
                                                    >
                                                        x
                                                    </td>
                                                );
                                            }
                                            return (
                                                <td
                                                    key={key}
                                                    ref={(el) => { cellRefs.current[key] = el }}
                                                    className={`px-4 py-2 cursor-pointer h-[35px] select-text scroll-m-5
                                                        ${checkFocus(rowIdx, field, date) ? "border-blue-500 border-2" : "border"}
                                                        ${checkEditingEffectCell(date, rowIdx, field) ? "bg-green-300" :
                                                            (["duration", "rest"].includes(field) && Number(row[field] ?? 0) < 0) ? "bg-red-300 text-stone-950 font-bold" : ""}`
                                                    }
                                                    onDoubleClick={() => {
                                                        if (
                                                            editing !== null &&
                                                            prevValue.toString().length > 0
                                                        ) {
                                                            handleTimeChange(editing, prevValue);
                                                        }
                                                        setFocus({
                                                            rowIdx,
                                                            field,
                                                            date,
                                                        });
                                                        setEditing({
                                                            pointId: row.id,
                                                            routeId: data[activeTab].id,
                                                            field,
                                                            date,
                                                            idx: rowIdx
                                                        });
                                                        setPrevValue(row[field]);
                                                    }}
                                                    onMouseDown={(e) => {
                                                        if (e.detail === 2) return;
                                                        if (
                                                            editing !== null &&
                                                            prevValue.toString().length > 0
                                                        ) {
                                                            handleTimeChange(editing, prevValue);
                                                        }
                                                        if (
                                                            checkFocus(rowIdx, field, date) &&
                                                            editing === null
                                                        ) {
                                                            setEditing({
                                                                pointId: row.id,
                                                                routeId: data[activeTab].id,
                                                                field,
                                                                date,
                                                                idx: rowIdx
                                                            });
                                                            setPrevValue(row[field]);
                                                        } else {
                                                            setEditing(null);
                                                            setFocus({ rowIdx, field, date });
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (
                                                            editing !== null &&
                                                            prevValue.toString().length > 0
                                                        ) {
                                                            handleTimeChange(editing, prevValue);
                                                        }
                                                    }}
                                                >
                                                    {checkEditing(row.id, field, date) ? (
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            autoFocus
                                                            value={prevValue}
                                                            onChange={(e) =>
                                                                setPrevValue(e.currentTarget.value)
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    if (inputRef.current && editing) {
                                                                        handleTimeChange(editing, inputRef.current.value);
                                                                        setEditing(null);
                                                                    }
                                                                }
                                                                if (e.key === "Escape") {
                                                                    e.preventDefault();
                                                                    setEditing(null);
                                                                }
                                                            }}
                                                            className="w-full h-full bg-transparent border-none outline-none px-0 py-0 text-sm"
                                                        />
                                                    ) : (
                                                        row[field]
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )}
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RouteTable;