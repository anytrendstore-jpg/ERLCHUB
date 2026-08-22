import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SERVER_IDS, SERVER_NAMES, CITY_NAMES } from '@/models/UserServerData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discordId, forceUpdate = false } = body;

    if (!discordId) {
      return NextResponse.json({ success: false, error: 'Discord ID requerido' }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    let existingData;
    try {
      existingData = await db.collection('userServerData').findOne({ discordId });
    } catch (findError) {
    }
    
    if (existingData && !forceUpdate) {
      return NextResponse.json({ 
        success: true, 
        message: 'Datos de servidores ya existen',
        data: {
          discordId: existingData.discordId,
          serverJoins: existingData.serverJoins,
          currentCity: existingData.currentCity,
          createdAt: existingData.createdAt,
          updatedAt: existingData.updatedAt
        }
      });
    }

    let user;
    try {
      user = await db.collection('users').findOne({ discordId });
    } catch (userError) {
      return NextResponse.json({ success: false, error: 'Error buscando usuario' }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    const now = new Date();
    const userCreatedAt = user.createdAt ? new Date(user.createdAt) : now;
    
    const serverData = {
      discordId,
      serverJoins: {
        erlchub: {
          serverId: SERVER_IDS.ERLCHUB,
          serverName: SERVER_NAMES[SERVER_IDS.ERLCHUB],
          joinedAt: userCreatedAt, 
          isActive: true
        }
      },
      currentCity: undefined, 
      createdAt: now,
      updatedAt: now
    };

    let result;
    if (existingData && forceUpdate) {
      result = await db.collection('userServerData').updateOne(
        { discordId },
        { $set: serverData }
      );
    } else {
      result = await db.collection('userServerData').insertOne(serverData);
    }

    return NextResponse.json({ 
      success: true, 
      message: forceUpdate ? 'Datos actualizados' : 'Datos inicializados',
      data: serverData
    });

  } catch (error) {
    console.error('Error inicializando datos de servidores:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error inicializando datos de servidores' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { discordId, cityId, joinedAt } = body;

    if (!discordId || !cityId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discord ID y City ID son requeridos' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    if (!CITY_NAMES[cityId as keyof typeof CITY_NAMES]) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ciudad no válida' 
      }, { status: 400 });
    }

    const now = new Date();
    const joinDate = joinedAt ? new Date(joinedAt) : now;
    const result = await db.collection('userServerData').updateOne(
      { discordId },
      { 
        $set: {
          'serverJoins.losSantos': {
            serverId: cityId,
            serverName: CITY_NAMES[cityId as keyof typeof CITY_NAMES],
            joinedAt: joinDate,
            isActive: true
          },
          currentCity: {
            id: cityId,
            name: CITY_NAMES[cityId as keyof typeof CITY_NAMES],
            joinedAt: joinDate
          },
          updatedAt: now
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario añadido a la ciudad',
      data: result
    });

  } catch (error) {
    console.error('Error añadiendo usuario a ciudad:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error añadiendo usuario a ciudad' 
    }, { status: 500 });
  }
}