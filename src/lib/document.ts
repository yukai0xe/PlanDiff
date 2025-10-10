import * as docx from "docx";
import { numberToChinese } from "./utility";

class ColumnBreak extends docx.Run {
    constructor() {
        super({
            children: [],
        });
        // 直接注入 XML <w:br w:type="column"/>
        (this as any).root.push(
            new (class extends docx.XmlComponent {
                constructor() {
                    super("w:br");
                    this.root.push({
                        _attr: {
                            "w:type": "column",
                        },
                    });
                }
            })()
        );
    }
}

function createColumnBreakParagraph() {
    const p = new docx.Paragraph({});
    // 用 XmlComponent 直接注入 <w:br w:type="column"/>
    (p as any).root.push(new ColumnBreak());
    return p;
}

const generateTable = (tableTitle: string, data: string[][]) => {
    const {
        Table,
        WidthType,
    } = docx;

    function makeDataRow(values: string[], idx: number) {
        return new docx.TableRow({
            children: values.map(
                (v) =>
                    new docx.TableCell({
                        margins: { left: 100 },
                        shading: { fill: idx % 2 !== 0 ? "#CCCCCC" : "#ffffff" },
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({
                                        text: v,
                                        font: "DFKai-SB",
                                        size: 24,
                                        color: "000000",
                                    }),
                                ],
                            }),
                        ],
                    })
            ),
        });
    }

    return [
        new docx.Paragraph({
            alignment: docx.AlignmentType.LEFT,
            children: [
                new docx.TextRun({
                    text: tableTitle,
                    font: "DFKai-SB",
                    size: 28,
                }),
            ],
        }), new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: docx.BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
                ...data.map((row, idx) => makeDataRow(row, idx + 1))
            ],
        })
    ]; 
}

const generateReferenceTable = (tableTitle: string, data: string[][]) => {

    if (!data || data.length === 0 || (Array.isArray(data[0]) && data[0].length === 0)) {
        return [new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
                new docx.TextRun({
                    text: "（無資料）",
                    font: "DFKai-SB",
                    size: 24,
                    color: "888888",
                    italics: true,
                }),
            ],
        })];
    };

    function makeDataRow(values: string[]) {
        return new docx.TableRow({
            children: values.map(
                (v) =>
                    new docx.TableCell({
                        margins: { left: 100 },
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({
                                        text: v,
                                        font: "DFKai-SB",
                                        size: 24,
                                        color: "000000",
                                    }),
                                ],
                            }),
                        ],
                    })
            ),
        });
    }

    return [
        new docx.Paragraph({
            alignment: docx.AlignmentType.LEFT,
            children: [
                new docx.TextRun({
                    text: tableTitle,
                    font: "DFKai-SB",
                    size: 24
                }),
            ],
        }),
        new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: {
                top: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
                bottom: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
                left: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
                right: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
                insideHorizontal: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
                insideVertical: { style: docx.BorderStyle.NONE, size: 0, color: "auto" },
            },
            rows: [
                ...data.map((row) => makeDataRow(row))
            ],
            layout: docx.TableLayoutType.AUTOFIT,
        })
    ];
}

const generateRouteReferencePage = (title: string, route: Route) => {
    const { source, teamSize, weather, days } = route;
    const leftColumnData: (docx.Paragraph | docx.Table)[] = [];
    const rightColumnData: (docx.Paragraph | docx.Table)[] = [];

    let dayIdx = 1;
    for (const points of Object.values(days)) {
        const pointTable: string[][] = points.map(p => [p.point || "空", p.arrive || "??:??"]);
        if (dayIdx <= 2) leftColumnData.push(...generateReferenceTable(`Day${dayIdx}`, pointTable), new docx.Paragraph(""));
        else rightColumnData.push(...generateReferenceTable(`Day${dayIdx}`, pointTable), new docx.Paragraph(""));
        dayIdx++;
    }

    return [
        {
            properties: {
                page: {
                    size: { orientation: docx.PageOrientation.PORTRAIT },
                    margin: { top: 720, bottom: 720, left: 720, right: 720 },
                },
            },
            children: [
                new docx.Paragraph({
                    alignment: docx.AlignmentType.LEFT,
                    children: [
                        new docx.TextRun({
                            text: title,
                            font: "DFKai-SB",
                            size: 48, // 24pt
                            bold: true,
                        }),
                    ],
                }),
                ...[{ label: "資料來源", value: source },
                    { label: "日期", value: `${Object.keys(days)[0]} ~ ${Object.keys(days)[Object.keys(days).length - 1]}` },
                    { label: "人數", value: teamSize.toString() },
                    { label: "天氣", value: weather }].map(data => new docx.Paragraph({
                    alignment: docx.AlignmentType.LEFT,
                    children: [
                        new docx.TextRun({
                            text: `${data.label}：${data.value}`,
                            font: "DFKai-SB",
                            size: 24,
                        }),
                    ],
                })),
                new docx.Paragraph(""),
            ]
        },
        {
            properties: {
                page: {
                    size: { orientation: docx.PageOrientation.PORTRAIT },
                    margin: { top: 720, bottom: 720, left: 720, right: 720 },
                },
                column: {
                    count: 2,
                    space: 720,
                },
                type: docx.SectionType.CONTINUOUS,
            },
            children: [
                ...leftColumnData,
                createColumnBreakParagraph(),
                ...rightColumnData
            ],
        }];
}

export default function generateDocument(routes: Route[], routesCompare: dayTableData[]) {
    const routeSections = routes.slice(1).flatMap((route, idx) =>
        generateRouteReferencePage("參考行程" + numberToChinese(idx + 1), route)
    );

    const overViewSection = {
        properties: {
            page: {
                size: { orientation: docx.PageOrientation.LANDSCAPE },
                margin: {
                    top: 720,
                    bottom: 720,
                    left: 720,
                    right: 720,
                },
            },
        },
        children: [
            new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                    new docx.TextRun({
                        text: "行程總覽",
                        bold: true,
                        font: "DFKai-SB",
                        size: 48
                    })
                ]
            }),
            
            ...routesCompare.flatMap((data, idx) => {
                const tableData: string[][] = [
                    ["", "本隊行程", ...routes.slice(1).map((_, idx) => `參考行程${numberToChinese(idx + 1)}`)],
                    ["人數", ...routes.map(r => r.teamSize.toString())],
                    ["天氣", ...routes.map(r => r.weather)],
                    ...data.dayPoints.flatMap((p) => [
                        [p.point, ...p.routes.map((r, idx) => {
                            if (!r) return "";
                            if (r.id === routes[idx].days[r.date][0].id) return r.depart || "";
                            if (r.arrive && r.rest > 0) return `${r.arrive}(休息${r.rest}')`;
                            return r.arrive || "";
                        })],
                        ["", ...p.routes.map((r) => (r ? `${r.duration.toString()}'` : ""))],
                    ])
                ];
                tableData.pop();

                return [
                    ...generateTable(data.day, tableData),
                    ...(idx < routesCompare.length - 1
                        ? [new docx.Paragraph({ children: [new docx.PageBreak()] })]
                        : []),
                ];
            }),
        ],
    };

    const doc = new docx.Document({
        sections: [
            ...routeSections,
            overViewSection
        ]
    });

    return doc;
}