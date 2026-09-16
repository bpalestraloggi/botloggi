import argparse

from botloggi import __version__


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="botloggi")
    parser.add_argument("--version", action="version", version=__version__)
    parser.parse_args(argv)

    print("botloggi: nothing to do yet")


if __name__ == "__main__":
    main()
