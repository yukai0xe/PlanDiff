import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { useState } from 'react';

interface SelectorProps {
    label?: string;
    selectedTab?: string;
    tabs: string[];
    onChange: (r: string) => void;
}

const Selector = ({ label, tabs, selectedTab, onChange }: SelectorProps) => {
    const [selected, setSelected] = useState<string>(selectedTab || "");
    const handleChange = (value: string) => {
        setSelected(value);
        onChange(value);
    };

    return (
        <Listbox value={selected} onChange={handleChange}>
            <div className="relative">
                <ListboxButton className="w-40 px-3 py-2 border rounded-lg bg-blue-500 shadow-sm text-white text-sm font-bold">
                    {label || selected}
                </ListboxButton>
                <ListboxOptions className="absolute mt-1 max-h-60 w-40 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm z-50">
                    {tabs.map((tab, idx) => (
                        <ListboxOption
                            key={idx}
                            value={tab}
                            className={({ active }) =>
                                `cursor-pointer select-none px-3 py-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                                }`
                            }
                        >
                            {tab}
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    )
}

export default Selector;