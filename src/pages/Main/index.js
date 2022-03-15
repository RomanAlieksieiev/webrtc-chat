import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router';
import {v4} from 'uuid';
import { List, Button, Row, Col, Typography, Layout, Card } from 'antd';
import socket from '../../socket';
import ACTIONS from '../../socket/actions';

const Main = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const rootNode = useRef()

  useEffect(() => {
    socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []} = {}) => {
      if (rootNode.current) {
        setRooms(rooms);
      }
    })
  }, []);

  return (
    <div ref={rootNode}>
      <Layout style={{ height: '100vh', overflow: 'auto', background: '#434343' }}>
        <Row>
          <Col span={22} offset={1} lg={{ span: 12, offset: 6 }}>
            <Card
              style={{marginTop: 110}}
              title='Available Rooms'
              extra={<Button onClick={() => navigate(`/room/${v4()}`)}>NEW ROOM</Button>}
            >
              <List
                itemLayout='horizontal'
                dataSource={rooms}
                renderItem={roomID => (
                  <List.Item
                    actions={[<Button type='text' onClick={() => navigate(`/room/${roomID}`)}>JOIN</Button>]}
                  >
                    <Typography.Text style={{
                      maxWidth: '70%',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}>{roomID}</Typography.Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Layout>
    </div>
  );
};

export default Main;