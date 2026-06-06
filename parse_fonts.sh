#!/usr/bin/env bash
# Reads TTF cmap tables from font files and outputs a JS eligibility map.
# Usage: bash parse_fonts.sh

FONTS_DIR="/c/Users/const/OneDrive/Privat/fonts"
declare -A FONT_FILES=(
  ["HW0"]="$FONTS_DIR/Myfont-Regular.ttf"
  ["HW1"]="$FONTS_DIR/Myfont2-Regular.ttf"
  ["HW2"]="$FONTS_DIR/Myfont3-Regular.ttf"
  ["HW3"]="$FONTS_DIR/Myfont4-Regular.ttf"
  ["HW4"]="$FONTS_DIR/Myfont4b-Regular.ttf"
  ["HW5"]="$FONTS_DIR/Myfont8-Regular.ttf"
)

# Read a big-endian uint16 at byte offset $2 in file $1
read_u16() {
  local file="$1" offset="$2"
  local hex
  hex=$(dd if="$file" bs=1 skip="$offset" count=2 2>/dev/null | xxd -p)
  printf "%d" "0x${hex}"
}

# Read a big-endian uint32 at byte offset $2 in file $1
read_u32() {
  local file="$1" offset="$2"
  local hex
  hex=$(dd if="$file" bs=1 skip="$offset" count=4 2>/dev/null | xxd -p)
  printf "%d" "0x${hex}"
}

# Read a big-endian int16 at byte offset $2 in file $1 (signed)
read_i16() {
  local file="$1" offset="$2"
  local hex val
  hex=$(dd if="$file" bs=1 skip="$offset" count=2 2>/dev/null | xxd -p)
  val=$(printf "%d" "0x${hex}")
  if [ "$val" -ge 32768 ]; then val=$((val - 65536)); fi
  echo "$val"
}

# Get all codepoints from a font file's cmap table.
# Outputs one hex codepoint per line.
get_codepoints() {
  local file="$1"

  # Offset table: numTables at offset 4
  local numTables
  numTables=$(read_u16 "$file" 4)

  # Find 'cmap' table in the table directory (starts at offset 12, each entry 16 bytes)
  local cmap_offset=-1
  for (( i=0; i<numTables; i++ )); do
    local base=$(( 12 + i * 16 ))
    local tag
    tag=$(dd if="$file" bs=1 skip="$base" count=4 2>/dev/null | xxd -p)
    # 636d6170 = "cmap"
    if [ "$tag" = "636d6170" ]; then
      cmap_offset=$(read_u32 "$file" $(( base + 8 )))
      break
    fi
  done

  if [ "$cmap_offset" -lt 0 ]; then return; fi

  # cmap header: numSubtables at cmap_offset + 2
  local numSub
  numSub=$(read_u16 "$file" $(( cmap_offset + 2 )))

  # Find best subtable: prefer format 12, then format 4
  local best_offset=-1 best_fmt=-1
  for (( i=0; i<numSub; i++ )); do
    local b=$(( cmap_offset + 4 + i * 8 ))
    local pid eid soff fmt
    pid=$(read_u16 "$file" "$b")
    eid=$(read_u16 "$file" $(( b + 2 )))
    soff=$(( cmap_offset + $(read_u32 "$file" $(( b + 4 ))) ))
    fmt=$(read_u16 "$file" "$soff")

    local is_unicode=0
    if [ "$pid" -eq 0 ]; then is_unicode=1; fi
    if [ "$pid" -eq 3 ] && { [ "$eid" -eq 1 ] || [ "$eid" -eq 10 ]; }; then is_unicode=1; fi
    [ "$is_unicode" -eq 0 ] && continue

    if [ "$fmt" -eq 12 ] && [ "$best_fmt" -lt 12 ]; then
      best_offset=$soff; best_fmt=12
    elif [ "$fmt" -eq 4 ] && [ "$best_fmt" -lt 4 ]; then
      best_offset=$soff; best_fmt=4
    fi
  done

  if [ "$best_offset" -lt 0 ]; then return; fi

  if [ "$best_fmt" -eq 4 ]; then
    local segCountX2
    segCountX2=$(read_u16 "$file" $(( best_offset + 6 )))
    local segCount=$(( segCountX2 / 2 ))
    local endBase=$(( best_offset + 14 ))
    local startBase=$(( endBase + segCount * 2 + 2 ))
    local deltaBase=$(( startBase + segCount * 2 ))
    local rangeBase=$(( deltaBase + segCount * 2 ))

    for (( i=0; i<segCount; i++ )); do
      local endCode startCode delta rangeOff
      endCode=$(read_u16 "$file" $(( endBase + i * 2 )))
      startCode=$(read_u16 "$file" $(( startBase + i * 2 )))
      delta=$(read_i16 "$file" $(( deltaBase + i * 2 )))
      rangeOff=$(read_u16 "$file" $(( rangeBase + i * 2 )))
      [ "$startCode" -eq 65535 ] && break

      for (( c=startCode; c<=endCode; c++ )); do
        if [ "$rangeOff" -eq 0 ]; then
          local gid=$(( (c + delta) % 65536 ))
          [ "$gid" -lt 0 ] && gid=$(( gid + 65536 ))
          [ "$gid" -ne 0 ] && printf "%d\n" "$c"
        else
          local idxOff=$(( rangeBase + i * 2 + rangeOff + (c - startCode) * 2 ))
          local gid2
          gid2=$(read_u16 "$file" "$idxOff")
          [ "$gid2" -ne 0 ] && printf "%d\n" "$c"
        fi
      done
    done

  elif [ "$best_fmt" -eq 12 ]; then
    local nGroups
    nGroups=$(read_u32 "$file" $(( best_offset + 12 )))
    for (( i=0; i<nGroups; i++ )); do
      local b=$(( best_offset + 16 + i * 12 ))
      local startChar endChar
      startChar=$(read_u32 "$file" "$b")
      endChar=$(read_u32 "$file" $(( b + 4 )))
      for (( c=startChar; c<=endChar; c++ )); do
        printf "%d\n" "$c"
      done
    done
  fi
}

echo "Parsing fonts..." >&2

# Build: cp_to_fonts[codepoint] = "HW0 HW1 ..."
declare -A cp_to_fonts

for id in "${!FONT_FILES[@]}"; do
  file="${FONT_FILES[$id]}"
  echo "  Scanning $id ($file)..." >&2
  while IFS= read -r cp; do
    if [ -n "${cp_to_fonts[$cp]+x}" ]; then
      cp_to_fonts[$cp]="${cp_to_fonts[$cp]},\"$id\""
    else
      cp_to_fonts[$cp]="\"$id\""
    fi
  done < <(get_codepoints "$file")
done

echo "  Building JSON..." >&2

# Output JS object
echo "const ELIG_MAP = {"
first=1
for cp in "${!cp_to_fonts[@]}"; do
  if [ "$first" -eq 1 ]; then first=0; else echo ","; fi
  printf "  %d:[%s]" "$cp" "${cp_to_fonts[$cp]}"
done
echo ""
echo "};"
echo "Done." >&2
