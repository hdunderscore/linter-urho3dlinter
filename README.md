# linter-urho3dlinter
Fork of  [linter-gcc](https://github.com/hebaishi/linter-gcc)

Linter plugin for [Linter](https://github.com/AtomLinter/Linter), provides an interface to [Urho3DLinter](https://github.com/hdunderscore/Urho3D/tree/Urho3DLinter) Angelscript/Lua

Similarly to linter-gcc, a local config file will be searched for named `.urho-flags.json`, example:
```json
{
  "execPath": "./Urho3DLinter",
  "defaultFlags": "-log debug",
  "defaultPackages": "Data;CoreData"
}
```
