import csv
from collections import Counter
from pathlib import Path


def _to_number(value: str) -> float | None:
    try:
        return float(value)
    except ValueError:
        pass
    # Brazilian format: 1.234,56
    if "," in value:
        try:
            return float(value.replace(".", "").replace(",", "."))
        except ValueError:
            return None
    return None


def _fmt(number: float) -> str:
    return f"{number:.2f}".rstrip("0").rstrip(".")


def _read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as f:
        sample = f.read(4096)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
        except csv.Error:
            dialect = csv.excel
        return list(csv.DictReader(f, dialect=dialect))


def summarize_csv(path: Path) -> str:
    rows = _read_rows(path)
    if not rows:
        return f"{path.name}: nenhuma linha de dados"

    columns = list(rows[0].keys())
    lines = [f"{path.name}: {len(rows)} linhas, {len(columns)} colunas", ""]

    for column in columns:
        values = [(row.get(column) or "").strip() for row in rows]
        filled = [v for v in values if v]
        empty = len(values) - len(filled)
        numbers = [_to_number(v) for v in filled]

        if filled and all(n is not None for n in numbers):
            total = sum(numbers)
            lines.append(f"{column} (numérica)")
            lines.append(
                f"  soma: {_fmt(total)}  média: {_fmt(total / len(numbers))}"
                f"  mín: {_fmt(min(numbers))}  máx: {_fmt(max(numbers))}"
            )
        else:
            lines.append(f"{column} (texto)")
            if filled:
                top, count = Counter(filled).most_common(1)[0]
                lines.append(
                    f"  valores distintos: {len(set(filled))}  mais comum: {top} ({count}x)"
                )
        if empty:
            lines.append(f"  vazios: {empty}")

    return "\n".join(lines)
