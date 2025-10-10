declare global {
    type RecordPoint = {
        id: string;
        point: string;
        arrive: string;
        depart: string;
        duration: number;
        rest: number;
        note: string;
        compareDetail: string;
    }

    type Route = {
        id: string;
        source: string;
        teamSize: number;
        weather: string;
        days: Record<string, RecordPoint[]>
    };

    type dayPoint = {
        point: string;
        routes: ((RecordPoint & { date: string; routeId: string }) | null)[];
    };

    type dayTableData = {
        day: string;
        dayPoints: dayPoint[];
    }
}

export {}