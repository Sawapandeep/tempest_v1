"use client";
// app/components/map/PlaceDetailPanel.tsx

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, MapPin, Navigation, Copy, ExternalLink, Bookmark,
    Phone, Globe, Clock, Star, ChevronDown, ChevronUp,
    Share2, Flag, Camera, Info, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCoordinates } from "@/lib/utils";
import { usePlaceDetails } from "@/features/places/hooks/usePlaceDetails";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useToast } from "@/app/components/ui/ToastProvider";
import type { PlaceDetails } from "@/types/place";

// ─────────────────────────────────────────────────────────────
// Skeleton loading state
// ─────────────────────────────────────────────────────────────
function PlaceSkeleton() {
    return (
        <div className="p-4 flex flex-col gap-3 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 rounded skeleton w-3/4" />
                    <div className="h-3 rounded skeleton w-1/3" />
                </div>
            </div>
            <div className="h-px bg-border/40" />
            <div className="space-y-2">
                <div className="h-3 rounded skeleton w-full" />
                <div className="h-3 rounded skeleton w-4/5" />
                <div className="h-3 rounded skeleton w-2/3" />
            </div>
            <div className="flex gap-2 pt-1">
                <div className="h-9 rounded-xl skeleton flex-1" />
                <div className="w-9 h-9 rounded-xl skeleton" />
                <div className="w-9 h-9 rounded-xl skeleton" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Opening hours badge
// ─────────────────────────────────────────────────────────────
function OpenStatusBadge({ openNow, raw }: { openNow: boolean; raw?: string }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="space-y-1">
            <button
                onClick={() => raw && setExpanded((e) => !e)}
                className="flex items-center gap-1.5 group"
                aria-expanded={expanded}
            >
                <div
                    className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        openNow ? "bg-emerald-400" : "bg-red-400"
                    )}
                />
                <span
                    className={cn(
                        "text-xs font-medium",
                        openNow ? "text-emerald-400" : "text-red-400"
                    )}
                >
                    {openNow ? "Open now" : "Closed"}
                </span>
                {raw && (
                    <span className="text-muted-foreground/60 text-xs">· {raw.split(";")[0]}</span>
                )}
                {raw && (
                    <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-3 h-3 text-muted-foreground/60 group-hover:text-muted-foreground" />
                    </motion.div>
                )}
            </button>

            <AnimatePresence>
                {expanded && raw && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="text-xs text-muted-foreground leading-relaxed pl-3.5 border-l border-border/50 ml-1 mt-1">
                            {raw}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Star rating display
// ─────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count?: number }) {
    return (
        <div className="flex items-center gap-1">
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={cn(
                            "w-3 h-3",
                            star <= Math.round(rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-border"
                        )}
                    />
                ))}
            </div>
            <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
            {count !== undefined && (
                <span className="text-xs text-muted-foreground">({count.toLocaleString()})</span>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Photo strip
// ─────────────────────────────────────────────────────────────
function PhotoStrip({ photos }: { photos: NonNullable<PlaceDetails["photos"]> }) {
    const [viewIdx, setViewIdx] = useState<number | null>(null);

    if (!photos.length) return null;

    return (
        <>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar -mx-4 px-4">
                {photos.map((photo, i) => (
                    <motion.button
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => setViewIdx(i)}
                        className="shrink-0 w-20 h-14 rounded-xl overflow-hidden border border-border/30 hover:border-tempest-500/50 transition-colors"
                        aria-label={`View photo ${i + 1}`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photo.thumb ?? photo.url}
                            alt={photo.caption ?? `Photo ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </motion.button>
                ))}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {viewIdx !== null && (
                    <motion.div
                        key="lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setViewIdx(null)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white/80 hover:text-white"
                            onClick={() => setViewIdx(null)}
                            aria-label="Close photo"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-2xl w-full"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={photos[viewIdx].url}
                                alt={photos[viewIdx].caption ?? ""}
                                className="w-full rounded-2xl"
                            />
                            {photos[viewIdx].caption && (
                                <p className="text-white/70 text-xs text-center mt-2">
                                    {photos[viewIdx].caption}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Detail row
// ─────────────────────────────────────────────────────────────
function DetailRow({
    icon: Icon,
    children,
    href,
    onClick,
    monospace = false,
}: {
    icon: React.ElementType;
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    monospace?: boolean;
}) {
    const inner = (
        <div
            className={cn(
                "flex items-start gap-2.5 group",
                (href || onClick) && "cursor-pointer"
            )}
        >
            <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0 group-hover:text-tempest-400 transition-colors" />
            <span
                className={cn(
                    "text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1 leading-relaxed",
                    monospace && "font-mono",
                    (href || onClick) && "group-hover:text-tempest-300 underline-offset-2 group-hover:underline"
                )}
            >
                {children}
            </span>
        </div>
    );

    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer">
                {inner}
            </a>
        );
    }

    if (onClick) {
        return <button onClick={onClick} className="w-full text-left">{inner}</button>;
    }

    return inner;
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────
function PlaceDetailPanelContent() {
    const { details, loadState, dismiss } = usePlaceDetails();
    const { toast } = useToast();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [descExpanded, setDescExpanded] = useState(false);

    if (!details && loadState === "idle") return null;

    const coords = details?.coordinates;
    const formattedCoords = coords
        ? formatCoordinates(coords.lat, coords.lng)
        : "";

    const copyCoords = async () => {
        if (!coords) return;
        await navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
        toast({ type: "success", title: "Coordinates copied", duration: 2000 });
    };

    const copyAddress = async () => {
        if (!details?.address) return;
        await navigator.clipboard.writeText(details.address);
        toast({ type: "success", title: "Address copied", duration: 2000 });
    };

    const openDirections = () => {
        if (!coords) return;
        window.open(
            `https://www.openstreetmap.org/directions?from=&to=${coords.lat},${coords.lng}`,
            "_blank"
        );
    };

    const sharePlace = async () => {
        const url = coords
            ? `https://www.openstreetmap.org/#map=17/${coords.lat}/${coords.lng}`
            : window.location.href;
        if (navigator.share) {
            await navigator.share({ title: details?.name, url });
        } else {
            await navigator.clipboard.writeText(url);
            toast({ type: "success", title: "Link copied", duration: 2000 });
        }
    };

    const websiteUrl = details?.contact?.website
        ? details.contact.website.startsWith("http")
            ? details.contact.website
            : `https://${details.contact.website}`
        : undefined;

    const hasOpeningHours = !!details?.openingHours;
    const hasPhotos = (details?.photos?.length ?? 0) > 0;
    const hasDesc = !!details?.description;
    const MAX_DESC = 140;

    return (
        <motion.div
            key="place-panel"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
                "glass rounded-2xl overflow-hidden",
                isMobile ? "w-full" : "max-w-sm w-full"
            )}
            role="complementary"
            aria-label={`Place details for ${details?.name ?? "selected place"}`}
        >
            {/* ── Header ── */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-start gap-3">
                    {/* Category icon */}
                    <div className="w-10 h-10 rounded-xl bg-tempest-500/15 border border-tempest-500/25 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-tempest-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                        {loadState === "loading" && !details ? (
                            <div className="space-y-1.5">
                                <div className="h-4 rounded skeleton w-3/4" />
                                <div className="h-3 rounded skeleton w-1/3" />
                            </div>
                        ) : (
                            <>
                                <h2 className="text-sm font-semibold text-foreground leading-snug">
                                    {details?.name}
                                </h2>
                                {details?.category && (
                                    <p className="text-[11px] text-tempest-400/80 mt-0.5 capitalize">
                                        {details.category}
                                    </p>
                                )}
                                {details?.rating !== undefined && (
                                    <div className="mt-1">
                                        <StarRating rating={details.rating} count={details.reviewCount} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <button
                        onClick={dismiss}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5 focus-visible:outline-none"
                        aria-label="Close place details"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Divider ── */}
            <div className="h-px bg-border/40 mx-4" />

            {/* ── Content ── */}
            {loadState === "loading" && !details ? (
                <PlaceSkeleton />
            ) : (
                <>
                    {/* Photos */}
                    {hasPhotos && (
                        <div className="px-4 pt-3">
                            <PhotoStrip photos={details!.photos!} />
                        </div>
                    )}

                    {/* Details list */}
                    <div className="px-4 py-3 space-y-2.5">
                        {/* Address */}
                        {details?.address && (
                            <DetailRow icon={MapPin} onClick={copyAddress}>
                                {details.address}
                            </DetailRow>
                        )}

                        {/* Coordinates */}
                        {coords && (
                            <DetailRow icon={Copy} onClick={copyCoords} monospace>
                                {formattedCoords}
                            </DetailRow>
                        )}

                        {/* Phone */}
                        {details?.contact?.phone && (
                            <DetailRow
                                icon={Phone}
                                href={`tel:${details.contact.phone}`}
                            >
                                {details.contact.phone}
                            </DetailRow>
                        )}

                        {/* Website */}
                        {websiteUrl && (
                            <DetailRow icon={Globe} href={websiteUrl}>
                                {details!.contact!.website}
                            </DetailRow>
                        )}

                        {/* Opening hours */}
                        {hasOpeningHours && (
                            <div className="flex items-start gap-2.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                <OpenStatusBadge
                                    openNow={details!.openingHours!.openNow}
                                    raw={details!.openingHours!.raw}
                                />
                            </div>
                        )}

                        {/* Description */}
                        {hasDesc && (
                            <div className="space-y-1">
                                <div className="flex items-start gap-2.5">
                                    <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {descExpanded || details!.description!.length <= MAX_DESC
                                                ? details!.description
                                                : `${details!.description!.slice(0, MAX_DESC)}…`}
                                        </p>
                                        {details!.description!.length > MAX_DESC && (
                                            <button
                                                onClick={() => setDescExpanded((e) => !e)}
                                                className="text-[10px] text-tempest-400 hover:text-tempest-300 mt-1 transition-colors"
                                            >
                                                {descExpanded ? "Show less" : "Read more"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OSM link */}
                        {details?.id.startsWith("osm-") && (
                            <DetailRow
                                icon={ExternalLink}
                                href={`https://www.openstreetmap.org/${coords ? `?mlat=${coords.lat}&mlon=${coords.lng}` : ""}`}
                            >
                                View on OpenStreetMap
                            </DetailRow>
                        )}
                    </div>

                    {/* ── Actions ── */}
                    <div className="px-4 pb-4 flex gap-2">
                        {/* Directions */}
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={openDirections}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl",
                                "text-xs font-medium bg-tempest-500 text-white",
                                "hover:bg-tempest-600 active:bg-tempest-700 transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            Directions
                        </motion.button>

                        {/* Save */}
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center",
                                "bg-surface-subtle border border-border/50",
                                "hover:bg-surface-elevated hover:border-tempest-500/40",
                                "text-muted-foreground hover:text-tempest-400 transition-all",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                            aria-label="Save place"
                        >
                            <Bookmark className="w-4 h-4" />
                        </motion.button>

                        {/* Share */}
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={sharePlace}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center",
                                "bg-surface-subtle border border-border/50",
                                "hover:bg-surface-elevated",
                                "text-muted-foreground hover:text-foreground transition-all",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                            aria-label="Share place"
                        >
                            <Share2 className="w-4 h-4" />
                        </motion.button>

                        {/* Report */}
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center",
                                "bg-surface-subtle border border-border/50",
                                "hover:bg-surface-elevated",
                                "text-muted-foreground hover:text-foreground transition-all",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                            aria-label="Report a problem"
                        >
                            <Flag className="w-4 h-4" />
                        </motion.button>
                    </div>
                </>
            )}
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────
// Export — wraps in AnimatePresence for mount/unmount animation
// ─────────────────────────────────────────────────────────────
export const PlaceDetailPanel = memo(function PlaceDetailPanel() {
    const selectedPlace = (() => {
        // read from mapStore directly to decide show/hide
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { useMapStore } = require("@/store/mapStore");
        return useMapStore((s: { selectedPlace: unknown }) => s.selectedPlace);
    })();

    return (
        <AnimatePresence>
            {selectedPlace && <PlaceDetailPanelContent />}
        </AnimatePresence>
    );
});