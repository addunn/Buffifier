# Buffifier
- Work in progress...
- Share an instance of an object across multiple web workers.
- Buffifier takes your class instance and intercepts all setters/getters.
- Data is stored/loaded to/from the SharedArrayBuffer safely via Atomics.
- For large object operations, you can lock the object manually during the process.
- Supports Float32/Float64 by converting them to Uint32/BigUint64 before calling store/load
