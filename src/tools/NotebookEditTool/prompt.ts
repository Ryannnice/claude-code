// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export const DESCRIPTION =
  'Replace the contents of a specific cell in a Jupyter notebook.'
// PROMPT保存`notebook`，供工具调用后续处理使用。
export const PROMPT = `Completely replaces the contents of a specific cell in a Jupyter notebook (.ipynb file) with new source. Jupyter notebooks are interactive documents that combine code, text, and visualizations, commonly used for data analysis and scientific computing. The notebook_path parameter must be an absolute path, not a relative path. The cell_number is 0-indexed. Use edit_mode=insert to add a new cell at the index specified by cell_number. Use edit_mode=delete to delete the cell at the index specified by cell_number.`
