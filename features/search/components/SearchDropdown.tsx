"use client";
// features/search/components/SearchDropdown.tsx

import { motion, AnimatePresence } from "framer-motion";
import { SearchResults } from "@/features/search/components/SearchResults";
import { useSearchStore } from "@/store/searchStore";

interface SearchDropdownProps {
    anchorRef?: React.RefObject<HTMLDivElement | null>;
    activeIndex?: number;
    onIndexChange?: (i: number) => void;
}

export function SearchDropdown({ activeIndex = -1, onIndexChange }: SearchDropdownProps) {
    const { isOpen, query, results, isSearching } = useSearchStore();

    const show = isOpen && (query.length > 0 || results.length > 0 || isSearching);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="search-dropdown"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="
            absolute top-full left-0 right-0 mt-2 z-40
            glass rounded-2xl overflow-hidden
            max-h-[380px] overflow-y-auto scrollbar-thin
            shadow-tempest-lg
          "
                    role="listbox"
                >
                    <SearchResults activeIndex={activeIndex} onIndexChange={onIndexChange} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}