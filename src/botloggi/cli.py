import argparse
from pathlib import Path

from botloggi import __version__
from botloggi.report import summarize_csv


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="botloggi")
    parser.add_argument("--version", action="version", version=__version__)
    commands = parser.add_subparsers(dest="command")
    report = commands.add_parser("report", help="resume um arquivo CSV")
    report.add_argument("path", type=Path, help="caminho do arquivo CSV")
    args = parser.parse_args(argv)

    if args.command == "report":
        try:
            print(summarize_csv(args.path))
        except OSError as e:
            parser.error(f"não foi possível ler {args.path}: {e.strerror}")
        return

    print("botloggi: nothing to do yet")


if __name__ == "__main__":
    main()
