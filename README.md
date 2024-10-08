
# ShowValues on Cinnamon applet

## Reload the applet

```bash
dbus-send --session --dest=org.Cinnamon.LookingGlass --type=method_call /org/Cinnamon/LookingGlass org.Cinnamon.LookingGlass.ReloadExtension string:'ShowValues@shirayu' string:'APPLET'
```

- <https://stackoverflow.com/questions/72706126/developing-task-bar-applets-for-cinnamon-how-to-reload-the-code>
    - press Alt + F2 → type "lg" → Enter
