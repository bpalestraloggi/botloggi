from botloggi.cli import main


def test_main_runs(capsys):
    main()
    captured = capsys.readouterr()
    assert captured.out.strip() == "botloggi: nothing to do yet"
