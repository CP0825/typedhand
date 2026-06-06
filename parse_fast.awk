#!/usr/bin/awk -f
# Parses a TTF binary (piped as raw bytes via xxd -p -c1) and extracts
# all Unicode codepoints from the best cmap subtable.
# Input: one hex byte per line (xxd -p -c 1)
# Output: one decimal codepoint per line

BEGIN {
    n = 0
}

# Read every byte into array b[] (0-indexed)
{
    val = strtonum("0x" $1)
    b[n++] = val
}

function u16(off,    v) {
    return b[off] * 256 + b[off+1]
}
function u32(off,    v) {
    return ((b[off] * 256 + b[off+1]) * 256 + b[off+2]) * 256 + b[off+3]
}
function i16(off,    v) {
    v = u16(off)
    if (v >= 32768) v -= 65536
    return v
}

END {
    # Find cmap table
    numTables = u16(4)
    cmapOff = -1
    for (i = 0; i < numTables; i++) {
        base = 12 + i * 16
        tag = sprintf("%c%c%c%c", b[base], b[base+1], b[base+2], b[base+3])
        if (tag == "cmap") {
            cmapOff = u32(base + 8)
            break
        }
    }
    if (cmapOff < 0) exit

    numSub = u16(cmapOff + 2)
    bestOff = -1
    bestFmt = -1

    for (i = 0; i < numSub; i++) {
        bb = cmapOff + 4 + i * 8
        pid = u16(bb)
        eid = u16(bb + 2)
        soff = cmapOff + u32(bb + 4)
        fmt  = u16(soff)

        isUni = 0
        if (pid == 0) isUni = 1
        if (pid == 3 && (eid == 1 || eid == 10)) isUni = 1
        if (!isUni) continue

        if (fmt == 12 && bestFmt < 12) { bestOff = soff; bestFmt = 12 }
        if (fmt == 4  && bestFmt <  4) { bestOff = soff; bestFmt =  4 }
    }

    if (bestOff < 0) exit

    if (bestFmt == 4) {
        segCount = u16(bestOff + 6) / 2
        endBase   = bestOff + 14
        startBase = endBase + segCount * 2 + 2
        deltaBase = startBase + segCount * 2
        rangeBase = deltaBase + segCount * 2

        for (i = 0; i < segCount; i++) {
            endCode   = u16(endBase   + i * 2)
            startCode = u16(startBase + i * 2)
            delta     = i16(deltaBase + i * 2)
            rangeOff  = u16(rangeBase + i * 2)
            if (startCode == 65535) break

            for (c = startCode; c <= endCode; c++) {
                if (rangeOff == 0) {
                    gid = (c + delta) % 65536
                    if (gid < 0) gid += 65536
                    if (gid != 0) print c
                } else {
                    idxOff = rangeBase + i * 2 + rangeOff + (c - startCode) * 2
                    gid = u16(idxOff)
                    if (gid != 0) print c
                }
            }
        }
    } else if (bestFmt == 12) {
        nGroups = u32(bestOff + 12)
        for (i = 0; i < nGroups; i++) {
            bb = bestOff + 16 + i * 12
            startChar = u32(bb)
            endChar   = u32(bb + 4)
            for (c = startChar; c <= endChar; c++) print c
        }
    }
}
