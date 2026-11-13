import pytest

from botloggi.cli import main


def test_report_summarizes_numeric_and_text_columns(tmp_path, capsys):
    csv_file = tmp_path / "vendas.csv"
    csv_file.write_text("cidade;valor\nSP;1.000,50\nRJ;20\nSP;\n", encoding="utf-8")

    main(argv=["report", str(csv_file)])
    out = capsys.readouterr().out

    assert "vendas.csv: 3 linhas, 2 colunas" in out
    assert "cidade (texto)" in out
    assert "valores distintos: 2  mais comum: SP (2x)" in out
    assert "valor (numérica)" in out
    assert "soma: 1020.5  média: 510.25  mín: 20  máx: 1000.5" in out
    assert "vazios: 1" in out


def test_report_missing_file_exits_with_error(tmp_path):
    with pytest.raises(SystemExit) as exc:
        main(argv=["report", str(tmp_path / "nao-existe.csv")])
    assert exc.value.code == 2
