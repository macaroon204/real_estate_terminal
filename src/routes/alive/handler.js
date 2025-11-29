// src/routes/alive/handler.js
import * as my_lib from '../../libs/my_lib.js';
import { env } from '../../config/env.js';

export async function getAlive(req, res) {
  // 요청 정보 1번만 가져오기
  const reqInfo = my_lib.get_req_url(req);
  const buf = reqInfo.buffer || {};

  const basePath = (buf.dest_url_path || '/alive').substring(1);
  const title = `${basePath}[${env.app.sysNo}]::`;
  const logBaseHeader = `${buf.str_data ?? ''} --> ${title}`;
  const logMsg = `[SUCC] ${logBaseHeader}()`;

  const ret = my_lib.sx_ret__create(1, 0);
  my_lib.sx_ret__write_data(ret, { sys_no: env.app.sysNo });

  console.log(logMsg);

  return res.status(200).json(ret);
}
