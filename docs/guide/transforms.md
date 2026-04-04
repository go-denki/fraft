# Transform Pipeline

The `transform` field on a request is an **ordered array of steps**. Each step receives the output of the previous one. Steps operate on the full response body — either an object or an array.

```yaml
requests:
  users:
    path: /users
    transform:
      - filter: { field: active, op: eq, value: true }
      - pick: [id, name, email]
      - rename: { userName: name }
```

---

## `pick` — keep only selected fields

```yaml
transform:
  - pick: [id, name, email]
```

Applied to an **array**, picks fields from every element. Applied to an **object**, picks fields from that object. Fields not listed are removed.

```yaml
# Input:  { id: 1, name: 'Alice', role: 'admin', password: 'hashed' }
# Output: { id: 1, name: 'Alice' }
transform:
  - pick: [id, name]
```

---

## `rename` — rename fields

```yaml
transform:
  - rename:
      userId: id
      userName: name
```

The format is `newName: oldName`. Works on arrays (applied to every element) and single objects. Fields not listed are left unchanged.

```yaml
# Input:  { id: 1, name: 'Alice' }
# Output: { userId: 1, userName: 'Alice' }
transform:
  - rename:
      userId: id
      userName: name
```

---

## `filter` — filter array items

```yaml
transform:
  - filter:
      field: status
      op: eq
      value: active
```

::: warning
`filter` **only works on arrays**. Applying it to a plain object throws an error.
:::

### Operators

| `op` | Description |
|------|-------------|
| `eq` | Strict equal (`===`) |
| `neq` | Not equal (`!==`) |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `contains` | String contains substring |
| `startsWith` | String starts with value |
| `endsWith` | String ends with value |

### Examples

```yaml
# Keep only published posts
- filter: { field: status, op: eq, value: published }

# Keep items with price above 10
- filter: { field: price, op: gt, value: 10 }

# Keep names starting with "A"
- filter: { field: name, op: startsWith, value: "A" }
```

---

## `coerce` — type coercion and arithmetic

```yaml
transform:
  - coerce:
      price:
        type: number
        expr: "*100"
        format: "%.2f"
      active: boolean
      code: string
```

Each key is a field name. The value can be:

- A **shorthand string**: `"string"`, `"number"`, or `"boolean"`
- A **rule object**:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"string"` \| `"number"` \| `"boolean"` | Cast the value to this type first. |
| `expr` | `string` | Arithmetic applied after cast: `"+5"`, `"-1"`, `"*100"`, `"/1000"`. |
| `format` | `string` | sprintf-style format applied last. Only `"%.Nf"` (fixed decimal) is supported. |

Works on arrays (applied to every element) and single objects.

### Examples

```yaml
# Cast active field to boolean
- coerce:
    active: boolean

# Convert price from cents to dollars, formatted to 2 decimal places
- coerce:
    price:
      type: number
      expr: "/100"
      format: "%.2f"

# Ensure id is always a string
- coerce:
    id: string
```

---

## `middleware` — custom transform function

```yaml
transform:
  - middleware: myTransformName
```

Calls a named function registered at runtime via `client.use()`. This is the escape hatch for any transformation that goes beyond the built-ins.

See [Custom Middleware](/guide/middleware) for full documentation.

---

## Combining steps

Steps execute in order. Each step's output becomes the next step's input:

```yaml
requests:
  products:
    path: /products
    transform:
      # 1. Keep only in-stock items (array → array)
      - filter: { field: inStock, op: eq, value: true }
      # 2. Keep only needed fields
      - pick: [id, name, price, category]
      # 3. Convert price to dollars
      - coerce:
          price:
            type: number
            expr: "/100"
            format: "%.2f"
      # 4. Rename for API consumers
      - rename:
          productId: id
          productName: name
```
