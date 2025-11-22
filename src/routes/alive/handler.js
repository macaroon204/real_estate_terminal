// src/routes/alive/handler.js
import * as my_lib from '../../libs/my_lib.js';

export async function getAlive(req, res) {
  let __base_url = my_lib.get_req_url(req).buffer.dest_url_path.substr(1);
  const TITLE = __base_url + "[" + process.env.SYS_NO + "]::";
  let LOG_BASE_HEADER =
    my_lib.get_req_url(req).buffer.str_data + " --> " + TITLE;

  let log_msg = "[SUCC] " + LOG_BASE_HEADER + "()";

  let ret = my_lib.sx_ret__create(1, 0);

  let data = { sys_no: process.env.SYS_NO };
  my_lib.sx_ret__write_data(ret, data);

  console.log(log_msg);

  return res.status(200).json(ret);
}
