import { create } from "zustand";
import { initialRouteData } from "@/data/routeData";
import { timeToMinutes, minutesToTime } from "@/lib/utility";
import toast from "react-hot-toast";
import stringSimilarity from "string-similarity";

function normalizeName(name: string): string {
    return name
        .replace(/\p{White_Space}+/gu, "")
        .replace(/[（）()]/g, "")
        .replace(/-/g, "")
        .replace(/\p{N}+/gu, "")
        .toLowerCase();
}

function isSamePoint(a: string, b: string): boolean {
    const normalizedA = normalizeName(a);
    const normalizedB = normalizeName(b);
    const similarity = stringSimilarity.compareTwoStrings(normalizedA, normalizedB);
    return similarity >= 0.9;
}

type RouteStore = {
    routes: Route[];
    routesCompare: dayTableData[];
    setRoutes: (routes: Route[]) => void;
    handleRouteCompareChange: () => void;
    handleTimeChange: (cell: Cell, newValue: string | number) => void;
};

type Cell = {
    field: keyof RecordPoint;
    date: string;
    pointId: string;
    routeId: string;
};

const sortDataRule = (route: Route) => {
    const { id, days } = route;
    const newRoute: Route = {
        id,
        source: route.source,
        teamSize: route.teamSize,
        weather: route.weather,
        days: {}
    };
    for (const [date, rows] of Object.entries(days)) {
        newRoute.days[date] = rows.map((row) => {
            return {
                id: row.id,
                point: row.point,
                arrive: row.arrive,
                rest: row.rest,
                depart: row.depart,
                duration: row.duration,
                note: row.note,
                compareDetail: row.compareDetail
            };
        });
    }
    return newRoute;
};

export const useRouteStore = create<RouteStore>((set, get) => ({
    routes: initialRouteData.map(sortDataRule),
    routesCompare: [],
    setRoutes: (routes) => {
        set({ routes: routes.map(sortDataRule) });
        get().handleRouteCompareChange();
    },
    clearRoutes: () => {
        set({ routes: [] });
        set({ routesCompare: [] });
    },
    handleRouteCompareChange: () => {
        const data = get().routes;
        const routeIdxs = Array.from({ length: data.length }, () => 0);
        const previousRouteIdxs = Array.from({ length: data.length }, () => 0);
        const routesCompare = Object.values(data[0].days).flatMap(
            (day, idx) => ({
                day: "Day" + (idx + 1),
                dayPoints: day.map((target) => ({
                    point: target.point,
                    routes: data.map((route, idx) => {
                        const currentRecord = Object.entries(route.days).flatMap(
                            ([date, items]) => items.map((item) => ({ date, ...item }))
                        );
                        while (routeIdxs[idx] < currentRecord.length && routeIdxs[idx] - previousRouteIdxs[idx] < 3) {
                            if (isSamePoint(currentRecord[routeIdxs[idx]].point, target.point)) {
                                previousRouteIdxs[idx] = routeIdxs[idx] + 1;
                                return {
                                    routeId: route.id,
                                    ...currentRecord[routeIdxs[idx]++],
                                };
                            }
                            routeIdxs[idx]++;
                        }
                        routeIdxs[idx] = previousRouteIdxs[idx];
                        if (routeIdxs[idx] - 1 > 0 && isSamePoint(currentRecord[routeIdxs[idx] - 1].point, target.point)) {
                            return {
                                routeId: route.id,
                                ...currentRecord[routeIdxs[idx] - 1],
                            };
                        }
                        return null;
                    }),
                })),
            })
        );
        set({ routesCompare });
    },
    handleTimeChange: (cell, newValue) => {
        const handleInputValidation = (field: string, value: string) => {
            if (field === "depart" || field === "arrive") {
                // 檢查時間格式 HH:mm
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                if (!timeRegex.test(value)) {
                    toast.error("時間格式錯誤，請輸入 HH:mm，例如 08:00、13:59");
                    return false;
                }
            }

            if (field === "duration" || field === "rest") {
                // 檢查整數
                const intVal = Number(value);
                if (!Number.isInteger(intVal) || intVal < 0) {
                    toast.error("請輸入正整數");
                    return false;
                }
            }

            return true;
        };
        const { field, date, routeId, pointId } = cell;
        const { routes } = get();
        if (!handleInputValidation(field, newValue.toString())) return;
        const newRoutes = routes.map((route) => {
            if (route.id !== routeId) return route;
            const newDays: typeof route.days = {};
            for (const d in route.days) {
                if (d !== date) {
                    newDays[d] = route.days[d].map((r) => ({ ...r }));
                } else {
                    const rows = route.days[d].map((r) => ({ ...r }));
                    const n = rows.length;
                    const selectedRowIdx = rows.findIndex((r) => r.id === pointId);
                    if (selectedRowIdx === -1) {
                        newDays[d] = rows.map((r) => ({ ...r }));
                        continue;
                    }
                    const newRows = rows.map((r,) => ({ ...r }));
                    const selectedRow = newRows[selectedRowIdx];
                    switch (field) {
                        case "depart":
                            if (typeof newValue === "string") {
                                const diff =
                                    timeToMinutes(newValue) -
                                    timeToMinutes(selectedRow.depart);
                                const startIdx = newRows.findIndex((r) => r.id === pointId);
                                for (let i = startIdx; i < n; i++) {
                                    if (i === startIdx) {
                                        newRows[i].rest = timeToMinutes(newValue) - timeToMinutes(newRows[i].arrive);
                                    }
                                    else {
                                        newRows[i].arrive =
                                            newRows[i].arrive.length > 0
                                                ? minutesToTime(timeToMinutes(newRows[i].arrive) + diff)
                                                : newValue;
                                    }
                                    newRows[i].depart =
                                        newRows[i].depart.length > 0
                                        ? minutesToTime(timeToMinutes(newRows[i].depart) + diff)
                                            : newValue;
                                }
                            }
                            break;
                        case "arrive":
                            if (typeof newValue === "string") {
                                const diff =
                                    timeToMinutes(newValue) -
                                    timeToMinutes(selectedRow.arrive);
                                const startIdx = newRows.findIndex((r) => r.id === pointId);
                                for (let i = startIdx - 1; i < n; i++) {
                                    if (i === startIdx - 1) {
                                        newRows[i].duration = timeToMinutes(newValue) - timeToMinutes(newRows[i].depart);
                                    }
                                    else {
                                        newRows[i].arrive =
                                            newRows[i].arrive.length > 0
                                                ? minutesToTime(timeToMinutes(newRows[i].arrive) + diff)
                                                : newValue;
                                        newRows[i].depart =
                                            newRows[i].depart.length > 0
                                                ? minutesToTime(timeToMinutes(newRows[i].depart) + diff)
                                                : newValue;
                                    }
                                }
                            }
                            break;
                        case "duration":
                            if (!isNaN(Number(newValue))) {
                                const delta = Number(newValue) - selectedRow.duration;
                                for (let i = selectedRowIdx; i < n - 1; i++) {
                                    if (i === selectedRowIdx)
                                        newRows[i].duration += delta;
                                    newRows[i + 1].arrive =
                                        newRows[i].depart.length > 0
                                            ? minutesToTime(
                                                timeToMinutes(newRows[i].depart) + newRows[i].duration)
                                            : "";
                                    newRows[i + 1].depart =
                                        newRows[i + 1].arrive.length > 0
                                            ? minutesToTime(
                                                timeToMinutes(newRows[i + 1].arrive) +
                                                newRows[i + 1].rest
                                            )
                                            : "";
                                }
                            }
                            break;
                        case "rest":
                            if (!isNaN(Number(newValue))) {
                                const delta = Number(newValue) - selectedRow.rest;
                                for (let i = selectedRowIdx; i < n - 1; i++) {
                                    if (i === selectedRowIdx) newRows[i].rest += delta;
                                    newRows[i].depart =
                                        newRows[i].arrive.length > 0
                                            ? minutesToTime(
                                                timeToMinutes(newRows[i].arrive) +
                                                newRows[i].rest
                                            )
                                            : "";
                                    newRows[i + 1].arrive =
                                        newRows[i].depart.length > 0
                                            ? minutesToTime(
                                                timeToMinutes(newRows[i].depart) +
                                                newRows[i].duration
                                            )
                                            : "";
                                }
                            }
                            break;
                        case "point":
                            selectedRow.point = newValue.toString();
                            break;
                        case "note":
                            selectedRow.note = newValue.toString();
                            break;
                        case "compareDetail":
                            selectedRow.compareDetail = newValue.toString();
                            break;
                    }
                    newDays[d] = newRows;
                }
            }
            return { ...route, days: newDays };
        });

        get().setRoutes(newRoutes);
    },
}));