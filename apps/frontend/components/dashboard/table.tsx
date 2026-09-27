import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from "react";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hoverable?: boolean;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ striped = false, hoverable = true, className = "", children, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto rounded-(--radius) border border-border">
        <table
          ref={ref}
          className={[
            "w-full text-sm",
            striped ? "table-striped" : "",
            hoverable ? "table-hoverable" : "",
            className,
          ].join(" ")}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = "Table";

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...props }, ref) => (
    <thead ref={ref} className={["bg-muted/50", className].join(" ")} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...props }, ref) => (
    <tbody ref={ref} className={className} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className = "", ...props }, ref) => (
    <tr
      ref={ref}
      className={[
        "border-b border-border transition-colors last:border-b-0",
        className,
      ].join(" ")}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", ...props }, ref) => (
    <th
      ref={ref}
      className={[
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      ].join(" ")}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", ...props }, ref) => (
    <td
      ref={ref}
      className={["px-4 py-3 text-foreground", className].join(" ")}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export default Table;
