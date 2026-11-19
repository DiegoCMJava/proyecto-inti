import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import type { Instance as FlatpickrInstance } from "flatpickr/dist/types/instance";
import { Spanish } from "flatpickr/dist/l10n/es.js"
import { useSolarStore } from "@/hooks/useSolarStore";


export function CalendarSection(){
    const inputRef = useRef<HTMLInputElement>(null);
    const fpRef = useRef<FlatpickrInstance | null>(null);
    const { selectedDate, eventsByDate, isLoading, setSelectedDate, loadMonthEvents } = useSolarStore();
    const eventsRef = useRef(eventsByDate);

   useEffect(() => {
    eventsRef.current = eventsByDate;

    if (fpRef.current){
        const dayElements = fpRef.current.calendarContainer?.querySelectorAll<HTMLElement>(".flatpickr-day");
        dayElements?.forEach((dayElem => {
            const dateObj = (dayElem as any ).dateObj;
            if (!dateObj) return;
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            const dateStr = `${year}-${month}-${day}`;

            if (eventsRef.current.has(dateStr)) {
                dayElem.classList.add("solar-flare-day");
                const flareCount = eventsRef.current.get(dateStr)?.length ?? 0;
                dayElem.title = `${flareCount} llamara(s) solar(es) detectada(s)`;
            } else {
                dayElem.classList.remove("solar-flare-day");
                dayElem.title = "";
            }
        }));
    }
   }, [eventsByDate]);

    useEffect(() => {
        const today = new Date();
        loadMonthEvents(today.getFullYear(), today.getMonth());
    }, [loadMonthEvents]);

    useEffect(() => {
        if(!inputRef.current) return;

        const fp = flatpickr(inputRef.current, {
            inline: true,
            locale: Spanish,
            defaultDate: selectedDate,
            dateFormat: "Y-m-d",
            maxDate: "today",
            monthSelectorType: "static",
            onChange: (_selectedDates, dateStr) => {
                if (dateStr){
                    setSelectedDate(dateStr);
                }
            },
            onMonthChange: (_selectedDates, _dateStr, instance) => {
                loadMonthEvents(instance.currentYear, instance.currentMonth);
            },
            onYearChange: (_selectedDates, _dateStr, instance) => {
                loadMonthEvents(instance.currentYear, instance.currentMonth);
            },
            onDayCreate: (_dObj, _dStr, _fp, dayElem) => {
                const dateObj = (dayElem as any).dateObj;
                if (!dateObj) return;

                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const day = String(dateObj.getDate()).padStart(2, "0");
                const dateStr = `${year}-${month}-${day}`;

                if(eventsRef.current.has(dateStr)) {
                    dayElem.classList.add("solar-flare-day");
                    const flareCount = eventsRef.current.get(dateStr)?.length ?? 0;
                    dayElem.title = `${flareCount} llamarada(s) solar(es) detectada(s)`
                }
            }
                });

                fpRef.current = fp;

                return () => {
                    fp.destroy();
                    fpRef.current = null;
                };
    }, [loadMonthEvents, setSelectedDate]);

    useEffect(() => {
            if (
                fpRef.current &&
                selectedDate &&
                fpRef.current.selectedDates[0]?.toISOString().split("T")[0] !== selectedDate
            ) {
                fpRef.current.setDate(selectedDate, false);
           
        }

    }, [ selectedDate]);
    return (
        <div className="bg-[#0e131f]/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-mono font-semibold text-amber-400 flex items-center gap-2">
                    <span>📅</span> Selección Cronológica
                </h2>
                {isLoading && (
                    <span className="flex items-center gap-1.5 text-xs text-amber-300 font-mono animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping">
                            Cargando NASA...
                        </span>
                    </span>
                )}
            </div>
            <div className="w-full flex justify-center [&_.flatpickr-calendar]:w-full! [&_.flatpickr-calendar]:max-w-85! [&_.flatpickr-innerContainer]:w-full! [&_.flatpickr-rContainer]:w-full! [&_.flatpickr-days]:w-full! [&_.dayContainer]:w-full! [&_.dayContainer]:max-w-none!">
                <input ref={inputRef} type="text" className="hidden" readOnly />
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] shrink-0"/>
                <span>Días destacados: eventos de llamaradas detectados</span>
            </div>
        </div>
    );
}